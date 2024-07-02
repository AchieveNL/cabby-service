// permit.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class CreatePermitDto {
  @IsString()
  @IsOptional()
  kiwaDocument?: string;

  @IsString()
  @IsOptional()
  kvkDocument?: string;

  @IsString()
  @IsOptional()
  kvkNumber?: string;

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

  @IsString()
  @IsOptional()
  kvkNumber?: string;

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
