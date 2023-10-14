// order.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  vehicleId: string;

  @IsNotEmpty()
  @IsString()
  rentalStartDate: string;

  @IsNotEmpty()
  @IsString()
  rentalEndDate: string;

  @IsString()
  @IsNotEmpty()
  note?: string;
}

export class RejectOrderDto {
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class CancelOrderDto {
  @IsNotEmpty()
  @IsString()
  orderId: string;
}

export class RejectConfirmOrderDto {
  @IsNotEmpty()
  @IsString()
  orderId: string;
}
