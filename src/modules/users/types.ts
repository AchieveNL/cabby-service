export enum UserStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  BLOCKED = 'BLOCKED',
  REJECTED = 'REJECTED',
  DEACTIVATED = 'DEACTIVATED',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface CreateUserInput {
  email: string;
  password: string;
  revokeTokensBefore?: Date;
  status?: UserStatus;
  role?: UserRole;
  Otp?: string;
  type?: string;
  profile?: UserProfileInput;
}

export interface UserProfileInput {
  city: string;
  driverLicenseBack?: string;
  driverLicenseExpiry?: Date;
  driverLicenseFront?: string;
  fullAddress: string;
  fullName: string;
  lastName: string;
  phoneNumber: string;
  profilePhoto?: string;
  signature?: string;
  taxiPermitExpiry?: Date;
  taxiPermitPicture?: string;
  dateOfBirth: Date;
  KiwaTaxiVergunning?: string;
  KvkDocument?: string;
  zip: string;
  driverLicense?: string;
  bsnNumber?: number;
  firstName: string;
  reason?: string;
  kiwaTaxiVergunningId?: string;
  kvkDocumentId?: string;
  taxiPermitId?: string;
}
