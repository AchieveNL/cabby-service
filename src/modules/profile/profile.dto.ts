import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class CreateUserProfileDto {
  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  fullAddress: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsNotEmpty()
  zip: string;

  @IsString()
  @IsOptional()
  profilePhoto?: string;

  @IsString()
  @IsOptional()
  signature?: string;

  @IsString()
  @IsNotEmpty()
  dateOfBirth: string;
}

export class CreateRentalAgreementDto {
  signature: Express.Multer.File;
}

export class EditUserProfileDto {
  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  fullAddress?: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  zip?: string;

  @IsString()
  @IsOptional()
  profilePhoto?: string;

  @IsString()
  @IsOptional()
  signature?: string;
}

export class UpdateExpiryDateDto {
  @IsDateString()
  @IsNotEmpty()
  driverLicenseExpiry: string;

  @IsDateString()
  @IsNotEmpty()
  taxiPermitExpiry: string;
}

export class UpdateDriverLicenseOrPermitDTO {
  @IsOptional()
  @IsString()
  imageKey?: string;

  @ValidateIf((o) => o.imageKey)
  @IsNotEmpty()
  @IsString()
  localFilePath?: string;

  @ValidateIf((o) => o.imageKey)
  @IsNotEmpty()
  @IsString()
  remoteFileName?: string;
}
