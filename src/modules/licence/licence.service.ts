import {
  type CreateDriverLicenseDto,
  type UpdateDriverLicenseDto,
} from './licence.dto';
import prisma from '@/lib/prisma';

export default class DriverLicenseService {
  async createDriverLicense(dto: CreateDriverLicenseDto) {
    try {
      const driverLicense = await prisma.driverLicense.create({ data: dto });
      return driverLicense;
    } catch (error) {
      throw new Error('Error creating driver license');
    }
  }

  async updateDriverLicense(userProfile: string, data: UpdateDriverLicenseDto) {
    try {
      const driverLicense = await prisma.driverLicense.update({
        where: { userProfile },
        data,
      });
      return driverLicense;
    } catch (error) {
      throw new Error('Error updating driver license');
    }
  }

  async updateExpiryDate(userProfileId: string, driverLicenseExpiry) {
    const permit = await prisma.permit.update({
      where: { userProfileId },
      data: {
        driverLicenseExpiry: new Date(driverLicenseExpiry),
      },
    });
    return permit;
  }
}
