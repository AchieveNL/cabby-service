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
  engineType?: string;

  @IsOptional()
  @IsString()
  seatingCapacity?: string;

  @IsOptional()
  @IsString()
  batteryCapacity?: string;

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
  zipcodeNumber?: string;

  @IsOptional()
  @IsString()
  zipcodeCharacter?: string;

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
