import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, IsDateString } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  shipId: string;

  @IsString()
  @IsNotEmpty()
  selectedClass: string;

  @IsNumber()
  @IsNotEmpty()
  classPrice: number;

  @IsNumber()
  @IsNotEmpty()
  passengerCount: number;

  @IsString()
  @IsOptional()
  vehicleType?: string;

  @IsNumber()
  @IsOptional()
  vehicleFee?: number;

  @IsArray()
  @IsNotEmpty()
  passengerDetails: any[];

  @IsNotEmpty()
  bookerDetails: any;

  @IsDateString()
  @IsNotEmpty()
  departureDate: string;
}