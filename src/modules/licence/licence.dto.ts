import { IsString, IsOptional } from 'class-validator';

export class CreateDriverLicenseDto {
  @IsString()
  driverLicenseBack: string;

  @IsString()
  driverLicenseFront: string;

  @IsString()
  driverLicenseExpiry: string;

  @IsString()
  dateOfBirth: string;

  @IsString()
  bsnNumber: string;

  @IsString()
  driverLicense: string;
}

export class UpdateDriverLicenseDto {
  @IsString()
  @IsOptional()
  driverLicenseBack?: string;

  @IsString()
  @IsOptional()
  driverLicenseFront?: string;

  @IsString()
  @IsOptional()
  driverLicenseExpiry?: string;

  @IsString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  bsnNumber?: string;

  @IsString()
  @IsOptional()
  driverLicense?: string;
}
