import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CapturePaymentDto {
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @IsNumber()
  @IsOptional()
  captureAmount?: number;
}