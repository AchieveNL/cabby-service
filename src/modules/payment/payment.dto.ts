// payment.dto.ts
import {
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDate,
  IsNumber,
} from 'class-validator';

export enum PaymentStatus {
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
}

export class CreatePaymentDto {
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsEnum(['RENT', 'REGISTRATION'])
  product: 'RENT' | 'REGISTRATION';

  @IsNotEmpty()
  @IsEnum(PaymentStatus)
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
