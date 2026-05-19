import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { XenditService } from '../xendit/xendit.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

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

    this.logger.log(`Creating payment for booking ${bookingId}, amount ${amount}, method ${method}`);

    // Verify booking exists
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true, ship: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Extract booker details
    const bookerDetails = booking.bookerDetails as any;
    const customerName = bookerDetails?.name || booking.user?.name || 'Customer';
    const customerEmail = bookerDetails?.email || booking.user?.email;
    const customerPhone = bookerDetails?.phone || '';

    try {
      // Create invoice via Xendit (most reliable method)
      const invoice = await this.xenditService.createInvoice({
        externalId: `BOOKING-${booking.bookingId}`,
        amount: amount,
        description: `Ferry booking: ${booking.bookingId} - ${booking.ship?.name || 'Ferry'} - ${booking.selectedClass}`,
        customerEmail: customerEmail,
        customerName: customerName,
        customerPhone: customerPhone,
        successRedirectUrl: `${this.configService.get('FRONTEND_URL')}/booking/success?bookingId=${bookingId}`,
        failureRedirectUrl: `${this.configService.get('FRONTEND_URL')}/booking/failed?bookingId=${bookingId}`,
      });

      this.logger.log(`Xendit invoice created: ${invoice.id}`);

      // Save payment record
      const payment = await this.prisma.payment.create({
        data: {
          bookingId,
          amount,
          method,
          status: 'PENDING',
          xenditPaymentId: invoice.id,
          xenditInvoiceUrl: invoice.invoice_url,
        },
      });

      return {
        paymentId: payment.id,
        checkoutUrl: invoice.invoice_url,
        invoiceId: invoice.id,
      };
    } catch (error) {
      this.logger.error(`Payment creation failed: ${error.message}`);
      throw new BadRequestException(error.message || 'Failed to create payment');
    }
  }

  async getPaymentStatus(bookingId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { bookingId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Get latest status from Xendit if available
    let xenditStatus = null;
    if (payment.xenditPaymentId) {
      try {
        const invoice = await this.xenditService.getInvoice(payment.xenditPaymentId);
        xenditStatus = invoice.status;
        
        // Update status if changed
        if (invoice.status === 'PAID' && payment.status !== 'COMPLETED') {
          await this.prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'COMPLETED', paidAt: new Date() },
          });
          await this.prisma.booking.update({
            where: { id: payment.bookingId },
            data: { status: 'CONFIRMED' },
          });
        }
      } catch (error) {
        this.logger.warn('Could not fetch Xendit invoice status');
      }
    }

    return {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      method: payment.method,
      paidAt: payment.paidAt,
      invoiceUrl: payment.xenditInvoiceUrl,
      xenditStatus,
    };
  }

  async getAvailablePaymentMethods() {
    return [
      { id: 'CREDIT_CARD', name: 'Credit / Debit Card', icon: '💳', enabled: true },
      { id: 'BANK_TRANSFER', name: 'Bank Transfer', icon: '🏦', enabled: true },
      { id: 'QRIS', name: 'QRIS', icon: '📱', enabled: true },
      { id: 'OVO', name: 'OVO', icon: '📱', enabled: true },
      { id: 'DANA', name: 'DANA', icon: '📱', enabled: true },
    ];
  }
}