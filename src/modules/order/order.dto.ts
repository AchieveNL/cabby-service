import { IsDateString, IsNotEmpty, IsString } from 'class-validator';
import { type OrderStatus } from './types';

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
}

export class CreateOrderAdminDto {
  @IsNotEmpty()
  @IsString()
  vehicleId: string;

  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsDateString()
  rentalStartDate: string;

  @IsNotEmpty()
  @IsDateString()
  rentalEndDate: string;
}

export class RejectOrderDto {
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class changeOrderStatusDto {
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @IsNotEmpty()
  @IsString()
  status: OrderStatus;
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

export class DeleteOrderDto {
  @IsNotEmpty()
  @IsString()
  orderId: string;
}

export class getRangeOrdersInvoicesDto {
  @IsNotEmpty()
  @IsDateString()
  start: string;

  @IsNotEmpty()
  @IsDateString()
  end: string;
}
