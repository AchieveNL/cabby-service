// payment.dto.ts

import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsDate,
  IsNumber,
} from 'class-validator';

export class CreatePaymentDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsEnum(['RENT', 'REGISTRATION'])
  product: 'RENT' | 'REGISTRATION';

  @IsNotEmpty()
  @IsEnum(['PAID', 'REFUNDED' /* other statuses */])
  status: string;

  @IsOptional()
  @IsDate()
  paymentDate?: Date;
}

export class UpdatePaymentDto {
  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsEnum(['RENT', 'REGISTRATION'])
  product?: 'RENT' | 'REGISTRATION';

  @IsOptional()
  @IsEnum(['PAID', 'REFUNDED' /* other statuses */])
  status?: string;

  @IsOptional()
  @IsDate()
  paymentDate?: Date;
}
