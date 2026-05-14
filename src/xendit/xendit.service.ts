import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class XenditService {
  private readonly baseUrl: string;
  private readonly authHeader: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.baseUrl = 'https://api.xendit.co';
    const secretKey = this.configService.get('XENDIT_SECRET_KEY');
    this.authHeader = `Basic ${Buffer.from(secretKey + ':').toString('base64')}`;
  }

  async createPaymentRequest(data: {
    referenceId: string;
    amount: number;
    currency?: string;
    paymentMethodType?: string;
    successReturnUrl?: string;
    failureReturnUrl?: string;
    customer?: any;
  }) {
    const {
      referenceId,
      amount,
      currency = 'IDR',
      paymentMethodType = 'CREDIT_CARD',
      successReturnUrl,
      failureReturnUrl,
      customer,
    } = data;

    const payload: any = {
      reference_id: referenceId,
      currency,
      amount,
      type: 'PAYMENT_REQUEST',
      capture_method: 'MANUAL',
      channel_code: paymentMethodType === 'CREDIT_CARD' ? 'CARDS' : paymentMethodType,
      channel_properties: {
        success_return_url: successReturnUrl || `${this.configService.get('FRONTEND_URL')}/booking/success`,
        failure_return_url: failureReturnUrl || `${this.configService.get('FRONTEND_URL')}/booking/failed`,
      },
    };

    if (customer) {
      payload.customer = {
        reference_id: customer.referenceId,
        email: customer.email,
        given_names: customer.name,
        phone_number: customer.phone,
      };
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/v3/payment_requests`, payload, {
          headers: {
            'Authorization': this.authHeader,
            'Content-Type': 'application/json',
          },
        }),
      );
      return response.data;
    } catch (error) {
      throw new BadRequestException(error.response?.data?.message || 'Failed to create payment request');
    }
  }

  async capturePayment(paymentId: string, captureAmount?: number) {
    const payload: any = {
      final_capture: true,
    };
    
    if (captureAmount) {
      payload.capture_amount = captureAmount;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/v3/payments/${paymentId}/capture`, payload, {
          headers: {
            'Authorization': this.authHeader,
            'Content-Type': 'application/json',
          },
        }),
      );
      return response.data;
    } catch (error) {
      throw new BadRequestException(error.response?.data?.message || 'Failed to capture payment');
    }
  }

  async getPayment(paymentId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/v3/payments/${paymentId}`, {
          headers: {
            'Authorization': this.authHeader,
          },
        }),
      );
      return response.data;
    } catch (error) {
      throw new BadRequestException(error.response?.data?.message || 'Failed to get payment');
    }
  }

  async getPaymentRequest(paymentRequestId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/v3/payment_requests/${paymentRequestId}`, {
          headers: {
            'Authorization': this.authHeader,
          },
        }),
      );
      return response.data;
    } catch (error) {
      throw new BadRequestException(error.response?.data?.message || 'Failed to get payment request');
    }
  }

  async createInvoice(data: {
    externalId: string;
    amount: number;
    description: string;
    customerEmail?: string;
    customerName?: string;
    successRedirectUrl?: string;
    failureRedirectUrl?: string;
  }) {
    const {
      externalId,
      amount,
      description,
      customerEmail,
      customerName,
      successRedirectUrl,
      failureRedirectUrl,
    } = data;

    const payload: any = {
      external_id: externalId,
      amount,
      description,
      currency: 'IDR',
      success_redirect_url: successRedirectUrl || `${this.configService.get('FRONTEND_URL')}/booking/success`,
      failure_redirect_url: failureRedirectUrl || `${this.configService.get('FRONTEND_URL')}/booking/failed`,
    };

    if (customerEmail) {
      payload.customer = {
        email: customerEmail,
        given_names: customerName,
      };
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/v2/invoices`, payload, {
          headers: {
            'Authorization': this.authHeader,
            'Content-Type': 'application/json',
          },
        }),
      );
      return response.data;
    } catch (error) {
      throw new BadRequestException(error.response?.data?.message || 'Failed to create invoice');
    }
  }

  async verifyWebhookToken(token: string): Promise<boolean> {
    const expectedToken = this.configService.get('XENDIT_WEBHOOK_TOKEN');
    return token === expectedToken;
  }
}