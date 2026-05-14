import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber, IsBoolean } from 'class-validator';

export class CreateShipDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  operator: string;

  @IsString()
  @IsNotEmpty()
  type: string; // "passenger-only" or "passenger-vehicle"

  @IsString()
  @IsNotEmpty()
  routeFrom: string;

  @IsString()
  @IsNotEmpty()
  routeTo: string;

  @IsString()
  @IsNotEmpty()
  departureTime: string;

  @IsArray()
  @IsOptional()
  availableDates?: string[];

  @IsOptional()
  classes?: any;

  @IsOptional()
  vehicleRates?: any;

  @IsArray()
  @IsOptional()
  amenities?: string[];

  @IsNumber()
  totalSeats: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}