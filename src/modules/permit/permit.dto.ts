// permit.dto.ts
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreatePermitDto {
  @IsString()
  @IsOptional()
  kiwaDocument?: string;

  @IsString()
  @IsOptional()
  kvkDocument?: string;

  @IsNumber()
  @IsOptional()
  kvkNumber?: number;

  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  taxiPermitId?: string;

  @IsString()
  @IsOptional()
  taxiPermitExpiry?: string;

  @IsString()
  @IsOptional()
  taxiPermitPicture?: string;
}

export class UpdatePermitDto {
  @IsString()
  @IsOptional()
  kiwaTaxiVergunningId?: string;

  @IsString()
  @IsOptional()
  kvkDocumentId?: string;

  @IsNumber()
  @IsOptional()
  kvkNumber?: number;

  @IsString()
  @IsOptional()
  taxiPermitId?: string;

  @IsString()
  @IsOptional()
  taxiPermitExpiry?: string;

  @IsString()
  @IsOptional()
  taxiPermitPicture?: string;
}
