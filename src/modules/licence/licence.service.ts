import { type UpdateDriverLicenseDto } from './licence.dto';
import prisma from '@/lib/prisma';

export default class DriverLicenseService {
  async createDriverLicense(data) {
    const driverLicense = await prisma.driverLicense.create({ data });
    return driverLicense;
  }

  async updateDriverLicense(userProfileId, data: UpdateDriverLicenseDto) {
    const driverLicense = await prisma.driverLicense.update({
      where: { userProfileId },
      data,
    });
    return driverLicense;
  }

  async updateExpiryDate(userProfileId: string, driverLicenseExpiry) {
    const permit = await prisma.driverLicense.update({
      where: { userProfileId },
      data: {
        driverLicenseExpiry,
      },
    });
    return permit;
  }
}
