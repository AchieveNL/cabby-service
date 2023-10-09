// permit.dto.ts
import { IsString, IsOptional, IsDate } from 'class-validator';

export class CreatePermitDto {
  @IsString()
  @IsOptional()
  kiwaTaxiVergunningId?: string;

  @IsString()
  @IsOptional()
  kvkDocumentId?: string;

  @IsString()
  @IsOptional()
  taxiPermitId?: string;

  @IsDate()
  @IsOptional()
  taxiPermitExpiry?: Date;

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
  taxiPermitId?: string;

  @IsDate()
  @IsOptional()
  taxiPermitExpiry?: Date;

  @IsString()
  @IsOptional()
  taxiPermitPicture?: string;
}
