import { IsString, IsDate, IsOptional, IsInt } from 'class-validator';

export class CreateDriverLicenseDto {
  @IsString()
  userId: string;

  @IsString()
  driverLicenseBack: string;

  @IsString()
  driverLicenseFront: string;

  @IsDate()
  driverLicenseExpiry: Date;

  @IsDate()
  dateOfBirth: Date;

  @IsInt()
  bsnNumber: number;

  @IsString()
  driverLicense: string;
}

export class UpdateDriverLicenseDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  driverLicenseBack?: string;

  @IsString()
  @IsOptional()
  driverLicenseFront?: string;

  @IsDate()
  @IsOptional()
  driverLicenseExpiry?: Date;

  @IsDate()
  @IsOptional()
  dateOfBirth?: Date;

  @IsInt()
  @IsOptional()
  bsnNumber?: number;

  @IsString()
  @IsOptional()
  driverLicense?: string;
}
