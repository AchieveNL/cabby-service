import { type UserProfileStatus } from './types';
import prisma from '@/lib/prisma';

export default class ProfileService {
  public async createUserProfile(userId, userProfileData) {
    try {
      const userProfile = await prisma.userProfile.create({
        data: {
          ...userProfileData,
          userId,
        },
      });
      return userProfile;
    } catch (error) {
      throw new Error('Error creating user profile');
    }
  }

  public async editUserProfile(id, userProfileData) {
    return await prisma.userProfile.update({
      where: { id },
      data: userProfileData,
    });
  }

  async getById(id: string) {
    return await prisma.userProfile.findUnique({
      where: {
        id,
        NOT: {
          driverLicense: null,
          permitDetails: null,
        },
      },
      include: {
        user: {
          select: {
            email: true,
            status: true,
          },
        },
        permitDetails: true,
        driverLicense: true,
      },
    });
  }

  async getByUserId(userId: string) {
    return await prisma.userProfile.findUnique({
      where: {
        userId,
        NOT: {
          driverLicense: null,
          permitDetails: null,
        },
      },
      include: {
        user: {
          select: {
            email: true,
            status: true,
          },
        },
        permitDetails: true,
        driverLicense: true,
      },
    });
  }

  async getAllDrivers() {
    return await prisma.userProfile.findMany({
      where: {
        NOT: {
          driverLicense: null,
          permitDetails: null,
        },
      },
      include: {
        permitDetails: true,
        driverLicense: true,
      },
    });
  }

  async updateUserProfileStatus(id: string, status: UserProfileStatus) {
    return await prisma.userProfile.update({
      where: { id },
      data: { status },
    });
  }

  async getUserProfileByStatus(status: UserProfileStatus) {
    return await prisma.userProfile.findMany({
      where: {
        status,
        NOT: {
          driverLicense: null,
          permitDetails: null,
        },
      },
      include: {
        permitDetails: true,
        driverLicense: true,
      },
    });
  }
}
