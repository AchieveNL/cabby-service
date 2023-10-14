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
