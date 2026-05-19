import { Controller, Post, Body, Get, Param, UseGuards, Request, Headers } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
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

  @Get('status/:bookingId')
  @UseGuards(JwtAuthGuard)
  getPaymentStatus(@Param('bookingId') bookingId: string) {
    return this.paymentsService.getPaymentStatus(bookingId);
  }
}