import { IsOptional, IsString } from 'class-validator';

export class SearchShipDto {
  @IsString()
  @IsOptional()
  routeFrom?: string;

  @IsString()
  @IsOptional()
  routeTo?: string;

  @IsString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  type?: string;
}