import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsArray,
  IsEnum,
  IsUUID,
} from 'class-validator';

enum VehicleStatus {
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable',
  // Add other statuses as needed
}

export class CreateVehicleDto {
  @IsNotEmpty()
  @IsString()
  companyName: string;

  @IsNotEmpty()
  @IsString()
  modelName: string;

  @IsNotEmpty()
  @IsString()
  rentalPeriod: string;

  @IsOptional()
  @IsString()
  plateNumber?: string;

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsNotEmpty()
  @IsString()
  year: string;

  @IsNotEmpty()
  @IsString()
  engine: string;

  @IsNotEmpty()
  @IsString()
  totalSeats: string;

  @IsNotEmpty()
  @IsString()
  batteryCapacity: string;

  @IsOptional()
  @IsString()
  specialFeature?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true }) // each: true applies the string validation to each item in the array
  carImages?: string[];

  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsNotEmpty()
  @IsString()
  currency: string;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  priceRangeFrom: number;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  priceRangeTo: number;
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
