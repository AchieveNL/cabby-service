import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
} from 'class-validator';

export class CreateDamageReportDto {
  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsNotEmpty()
  @IsUUID()
  vehicleId: string;
}
