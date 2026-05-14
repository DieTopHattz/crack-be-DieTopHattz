import { Controller, Post, Body, Get, Param, UseGuards, Request, Headers, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CapturePaymentDto } from './dto/capture-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('methods')
  getAvailablePaymentMethods() {
    return this.paymentsService.getAvailablePaymentMethods();
  }

  @Post('create-intent')
  @UseGuards(JwtAuthGuard)
  createPaymentIntent(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.createPaymentIntent(createPaymentDto);
  }

  @Post('capture')
  @UseGuards(JwtAuthGuard)
  capturePayment(@Body() capturePaymentDto: CapturePaymentDto) {
    return this.paymentsService.capturePayment(capturePaymentDto);
  }

  @Post('invoice/:bookingId')
  @UseGuards(JwtAuthGuard)
  createInvoicePayment(
    @Param('bookingId') bookingId: string,
    @Body('amount') amount: number,
  ) {
    return this.paymentsService.createInvoicePayment(bookingId, amount);
  }

  @Get('status/:bookingId')
  @UseGuards(JwtAuthGuard)
  getPaymentStatus(@Param('bookingId') bookingId: string) {
    return this.paymentsService.getPaymentStatus(bookingId);
  }

  @Post('webhook')
  async handleWebhook(
    @Headers('x-callback-token') callbackToken: string,
    @Body() body: any,
  ) {
    return this.paymentsService.handleWebhook(callbackToken, body);
  }
}