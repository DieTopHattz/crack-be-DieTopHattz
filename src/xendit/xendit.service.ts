import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class XenditService {
  private readonly baseUrl: string;
  private readonly authHeader: string;
  private readonly apiVersion: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.baseUrl = 'https://api.xendit.co';
    const secretKey = this.configService.get('XENDIT_SECRET_KEY');
    this.authHeader = `Basic ${Buffer.from(secretKey + ':').toString('base64')}`;
    this.apiVersion = '2024-11-11';
  }

  private getHeaders() {
    return {
      'Authorization': this.authHeader,
      'Content-Type': 'application/json',
      'api-version': this.apiVersion,
    };
  }

  // Method 1: Create Invoice (Simplest, works for all payment methods)
  async createInvoice(data: {
    externalId: string;
    amount: number;
    description: string;
    customerEmail?: string;
    customerName?: string;
    customerPhone?: string;
    successRedirectUrl?: string;
    failureRedirectUrl?: string;
  }) {
    const {
      externalId,
      amount,
      description,
      customerEmail,
      customerName,
      customerPhone,
      successRedirectUrl,
      failureRedirectUrl,
    } = data;

    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';

    const payload: any = {
      external_id: externalId,
      amount: amount,
      description: description,
      currency: 'IDR',
      success_redirect_url: successRedirectUrl || `${frontendUrl}/booking/success`,
      failure_redirect_url: failureRedirectUrl || `${frontendUrl}/booking/failed`,
    };

    if (customerEmail) {
      payload.customer = {
        email: customerEmail,
        given_names: customerName || 'Customer',
        phone_number: customerPhone || '',
      };
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/v2/invoices`, payload, {
          headers: this.getHeaders(),
        }),
      );
      return response.data;
    } catch (error) {
      throw new BadRequestException(error.response?.data?.message || 'Failed to create invoice');
    }
  }

  // Method 2: Create Payment Request (For direct card payments)
  async createPaymentRequest(data: {
    referenceId: string;
    amount: number;
    currency?: string;
    paymentMethod: string;
    successReturnUrl?: string;
    failureReturnUrl?: string;
    customer?: any;
  }) {
    const {
      referenceId,
      amount,
      currency = 'IDR',
      paymentMethod,
      successReturnUrl,
      failureReturnUrl,
      customer,
    } = data;

    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';

    // Map payment method to Xendit channel code
    const channelCodeMap: Record<string, string> = {
      'CREDIT_CARD': 'CARDS',
      'BANK_TRANSFER': 'BCA',
      'BCA': 'BCA',
      'MANDIRI': 'MANDIRI',
      'BRI': 'BRI',
      'BNI': 'BNI',
      'OVO': 'OVO',
      'DANA': 'DANA',
      'QRIS': 'QRIS',
      'LINKAJA': 'LINKAJA',
    };

    const channelCode = channelCodeMap[paymentMethod] || 'CARDS';

    const payload: any = {
      reference_id: referenceId,
      currency: currency,
      amount: amount,
      type: 'PAYMENT_REQUEST',
      channel_code: channelCode,
      channel_properties: {
        success_return_url: successReturnUrl || `${frontendUrl}/booking/success`,
        failure_return_url: failureReturnUrl || `${frontendUrl}/booking/failed`,
      },
    };

    // Add customer if provided
    if (customer) {
      payload.customer = {
        reference_id: customer.referenceId,
        email: customer.email,
        given_names: customer.name,
        phone_number: customer.phone,
      };
    }

    // Add e-wallet specific properties
    if (channelCode === 'OVO' || channelCode === 'DANA') {
      payload.channel_properties.mobile_number = customer?.phone || '+6281234567890';
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/v3/payment_requests`, payload, {
          headers: this.getHeaders(),
        }),
      );
      return response.data;
    } catch (error) {
      throw new BadRequestException(error.response?.data?.message || 'Failed to create payment request');
    }
  }

  async getInvoice(invoiceId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/v2/invoices/${invoiceId}`, {
          headers: this.getHeaders(),
        }),
      );
      return response.data;
    } catch (error) {
      throw new BadRequestException(error.response?.data?.message || 'Failed to get invoice');
    }
  }

  async verifyWebhookToken(token: string): Promise<boolean> {
    const expectedToken = this.configService.get('XENDIT_WEBHOOK_TOKEN');
    return token === expectedToken;
  }
}