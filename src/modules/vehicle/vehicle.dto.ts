import { type VehicleEngineType } from '@prisma/client';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsUUID,
  IsNumber,
} from 'class-validator';

enum VehicleStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
  BLOCKED = 'BLOCKED',
}

export class CreateVehicleDto {
  @IsOptional()
  @IsString()
  logo?: string;

  @IsNotEmpty()
  @IsString()
  companyName: string;

  @IsNotEmpty()
  @IsString()
  model: string;

  @IsOptional()
  @IsString()
  licensePlate?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  manufactureYear?: string;

  @IsOptional()
  @IsString()
  engineType?: VehicleEngineType;

  @IsOptional()
  @IsString()
  seatingCapacity?: string;

  @IsOptional()
  @IsNumber()
  batteryCapacity?: number;

  @IsOptional()
  @IsString()
  uniqueFeature?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsString()
  availability?: string;

  @IsOptional()
  @IsString()
  unavailabilityReason?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  pricePerDay?: number;

  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @IsOptional()
  @IsString()
  vin?: string;

  @IsOptional()
  @IsString()
  streetName?: string;

  @IsOptional()
  @IsString()
  streetNumber?: string;

  @IsOptional()
  @IsString()
  zipcode?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  timeframes?: {
    day: string;
    title: string;
    data: { title: string; value: number };
  };
}

export class UpdateVehicleStatusDto {
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @IsNotEmpty()
  @IsString()
  status: string;
}

export class FilterVehiclesDto {
  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  category?: string;
}
