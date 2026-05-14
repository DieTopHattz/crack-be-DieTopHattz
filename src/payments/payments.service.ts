import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { XenditService } from '../xendit/xendit.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CapturePaymentDto } from './dto/capture-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private xenditService: XenditService,
  ) {}

  async createPaymentIntent(createPaymentDto: CreatePaymentDto) {
    const { bookingId, amount, method } = createPaymentDto;

    // Verify booking exists
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true, ship: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Extract booker details from Json (Prisma stores Json as any)
    const bookerDetails = booking.bookerDetails as any;
    const userEmail = bookerDetails?.email || booking.user?.email;
    const userName = bookerDetails?.name || booking.user?.name;
    const userPhone = bookerDetails?.phone || '';

    // Create payment request in Xendit
    const paymentRequest = await this.xenditService.createPaymentRequest({
      referenceId: bookingId,
      amount,
      currency: 'IDR',
      paymentMethodType: method === 'CREDIT_CARD' ? 'CREDIT_CARD' : 'EWALLET',
      successReturnUrl: `${this.configService.get('FRONTEND_URL')}/booking/${bookingId}/success`,
      failureReturnUrl: `${this.configService.get('FRONTEND_URL')}/booking/${bookingId}/failed`,
      customer: {
        referenceId: booking.user.id,
        email: userEmail,
        name: userName,
        phone: userPhone,
      },
    });

    // Save payment record
    const payment = await this.prisma.payment.create({
      data: {
        bookingId,
        amount,
        method,
        status: 'PENDING',
        xenditPaymentId: paymentRequest.id,
        xenditInvoiceUrl: paymentRequest.actions?.find((a: any) => a.type === 'REDIRECT_CUSTOMER')?.url,
      },
    });

    return {
      paymentId: payment.id,
      xenditPaymentId: paymentRequest.id,
      checkoutUrl: payment.xenditInvoiceUrl,
      paymentRequest: paymentRequest,
    };
  }

  async capturePayment(capturePaymentDto: CapturePaymentDto) {
    const { paymentId, captureAmount } = capturePaymentDto;

    // Find payment in database
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'PENDING' && payment.status !== 'AUTHORIZED') {
      throw new BadRequestException('Payment cannot be captured');
    }

    if (!payment.xenditPaymentId) {
      throw new BadRequestException('No Xendit payment ID found');
    }

    try {
      // Capture the payment in Xendit
      const captureResult = await this.xenditService.capturePayment(
        payment.xenditPaymentId,
        captureAmount || payment.amount,
      );

      // Update payment record
      const updatedPayment = await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'COMPLETED',
          paidAt: new Date(),
          xenditPaymentId: captureResult.id,
        },
      });

      // Update booking status
      await this.prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'CONFIRMED' },
      });

      return updatedPayment;
    } catch (error) {
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'FAILED', failureReason: error.message },
      });
      throw new BadRequestException('Payment capture failed');
    }
  }

  async getPaymentStatus(bookingId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { bookingId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Get latest status from Xendit if needed
    let xenditStatus = null;
    if (payment.xenditPaymentId) {
      try {
        const xenditPayment = await this.xenditService.getPayment(payment.xenditPaymentId);
        xenditStatus = xenditPayment.status;
      } catch (error) {
        this.logger.warn('Could not fetch Xendit payment status');
      }
    }

    return {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      method: payment.method,
      paidAt: payment.paidAt,
      xenditStatus,
      failureReason: payment.failureReason,
    };
  }

  async handleWebhook(signature: string, payload: any) {
    // Verify webhook signature
    const isValid = await this.xenditService.verifyWebhookToken(signature);
    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Received webhook: ${payload.event}`);

    switch (payload.event) {
      case 'payment_request.captured':
      case 'payment.capture':
        await this.handlePaymentCaptured(payload.data);
        break;
      case 'payment_request.expired':
      case 'payment.failure':
        await this.handlePaymentFailed(payload.data);
        break;
      default:
        this.logger.log(`Unhandled event type: ${payload.event}`);
    }

    return { received: true };
  }

  private async handlePaymentCaptured(data: any) {
    const payment = await this.prisma.payment.findFirst({
      where: { xenditPaymentId: data.payment_id || data.id },
    });

    if (payment && payment.status !== 'COMPLETED') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'COMPLETED', paidAt: new Date() },
      });

      await this.prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'CONFIRMED' },
      });
    }
  }

  private async handlePaymentFailed(data: any) {
    const payment = await this.prisma.payment.findFirst({
      where: { xenditPaymentId: data.payment_id || data.id },
    });

    if (payment) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', failureReason: data.failure_reason },
      });
    }
  }

  private mapPaymentMethodToChannel(method: string): string {
    const mapping: Record<string, string> = {
      CREDIT_CARD: 'CARDS',
      OVO: 'OVO',
      DANA: 'DANA',
      QRIS: 'QRIS',
      BANK_TRANSFER: 'BCA',
    };
    return mapping[method] || 'CARDS';
  }

  async createInvoicePayment(bookingId: string, amount: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Extract booker details from Json
    const bookerDetails = booking.bookerDetails as any;

    const invoice = await this.xenditService.createInvoice({
      externalId: `BOOKING-${bookingId}`,
      amount,
      description: `Ferry booking: ${booking.bookingId}`,
      customerEmail: bookerDetails?.email || booking.user?.email,
      customerName: bookerDetails?.name || booking.user?.name,
    });

    const payment = await this.prisma.payment.create({
      data: {
        bookingId,
        amount,
        method: 'INVOICE',
        status: 'PENDING',
        xenditPaymentId: invoice.id,
        xenditInvoiceUrl: invoice.invoice_url,
      },
    });

    return {
      paymentId: payment.id,
      invoiceUrl: invoice.invoice_url,
    };
  }

  async getAvailablePaymentMethods() {
    return [
      { id: 'CREDIT_CARD', name: 'Credit / Debit Card', icon: '💳', enabled: true },
      { id: 'OVO', name: 'OVO', icon: '📱', enabled: true },
      { id: 'DANA', name: 'DANA', icon: '📱', enabled: true },
      { id: 'QRIS', name: 'QRIS', icon: '📱', enabled: true },
      { id: 'BANK_TRANSFER', name: 'Bank Transfer', icon: '🏦', enabled: true },
    ];
  }
}