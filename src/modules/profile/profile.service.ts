/* eslint-disable @typescript-eslint/ban-ts-comment */
import { NotificationService } from '../notifications/notification.service';
import UserMailService from '../notifications/user-mails.service';
import { UserProfileStatus } from './types';
import prisma from '@/lib/prisma';

export default class ProfileService {
  private readonly notificationService = new NotificationService();
  private readonly userMailService = new UserMailService();

  public async createUserProfile(userId, userProfileData) {
    try {
      const userProfile = await prisma.userProfile.create({
        data: {
          ...userProfileData,
          userId,
          status: UserProfileStatus.REQUIRE_REGISTRATION_FEE,
        },
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      await this.userMailService.driverSideMailSender(
        userProfileData.user?.email,
        userProfile.firstName
      );
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
        userVerification: true,
      },
    });
  }

  async getByUserId(userId: string) {
    return await prisma.userProfile.findUnique({
      where: {
        userId,
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

  async updateUserProfileStatus(
    id: string,
    status: UserProfileStatus,
    reason: string
  ) {
    function createNotificationMessage(status: UserProfileStatus): string {
      switch (status) {
        case UserProfileStatus.APPROVED:
          return 'Congratulations! Your account has been approved. You can now enjoy all our services.';
        case UserProfileStatus.BLOCKED:
          return 'Your account has been blocked due to policy violations. Please contact support for more information.';
        case UserProfileStatus.INACTIVE:
          return 'Your account is currently inactive. Please update your profile to reactivate.';
        case UserProfileStatus.REJECTED:
          return 'We regret to inform you that your account application has been rejected. Please review our requirements and apply again.';
        case UserProfileStatus.REQUIRE_REGISTRATION_FEE:
          return 'Your account is almost ready! Please complete the registration fee payment to activate your account.';
        // Add cases for other statuses if needed
        default:
          return 'There has been an update to your account status. Please check your profile for more details.';
      }
    }

    const updatedProfile = await prisma.userProfile.update({
      where: { id },
      data: { status },
      include: {
        user: true,
      },
    });

    if (updatedProfile.status === UserProfileStatus.APPROVED) {
      await this.userMailService.driverApprovedMailSender(
        updatedProfile.user?.email,
        updatedProfile.firstName
      );
    } else if (updatedProfile.status === UserProfileStatus.REJECTED) {
      await this.userMailService.driverRejectedMailSender(
        updatedProfile.user?.email,
        updatedProfile.firstName
      );
      // @ts-expect-error
    } else if (updatedProfile.status === 'REJECTED') {
      await this.userMailService.driverRejectedMailSender(
        updatedProfile.user?.email,
        updatedProfile.firstName
      );
    } else if (updatedProfile.status === UserProfileStatus.BLOCKED) {
      if (reason.includes('Fraude')) {
        await this.userMailService.driverBlockedFraudeMailSender(
          updatedProfile.user?.email,
          updatedProfile.firstName
        );
      } else if (reason.includes('Herhaalde')) {
        await this.userMailService.driverBlockedHerhaaldeMailSender(
          updatedProfile.user?.email,
          updatedProfile.firstName
        );
      } else if (reason.includes('Onacceptabel')) {
        await this.userMailService.driverBlockedOnacceptabelMailSender(
          updatedProfile.user?.email,
          updatedProfile.firstName
        );
      } else if (reason.includes('Ongeldige')) {
        await this.userMailService.driverBlockedOngeldigeMailSender(
          updatedProfile.user?.email,
          updatedProfile.firstName
        );
      } else if (reason.includes('Schending')) {
        await this.userMailService.driverBlockedSchendingMailSender(
          updatedProfile.user?.email,
          updatedProfile.firstName
        );
      } else if (reason.includes('Voertuigprobleme')) {
        await this.userMailService.driverBlockedVoertuigproblemenMailSender(
          updatedProfile.user?.email,
          updatedProfile.firstName
        );
      } else {
        await this.userMailService.driverBlockedMailSender(
          updatedProfile.user?.email,
          updatedProfile.firstName
        );
      }
    }

    const messageBody = createNotificationMessage(status);

    const metadata = JSON.stringify({ status });

    if (updatedProfile.user) {
      try {
        await this.notificationService.sendNotificationToUser(
          updatedProfile.userId,
          'Account Status Update',
          messageBody,
          metadata
        );
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    }

    return updatedProfile;
  }

  async getUserProfileByStatus(status: UserProfileStatus) {
    console.log(status);
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

  async getUserProfileStatusByUserId(userId: string) {
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { status: true },
    });

    return userProfile?.status;
  }

  async getUserProfileIdByUserId(userId: string) {
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    return userProfile?.id;
  }
}
