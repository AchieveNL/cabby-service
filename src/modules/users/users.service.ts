import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { type UserStatus, type user } from '@prisma/client';
import { HttpStatusCode } from 'axios';
import UserMailService from '../notifications/user-mails.service';
import { type ChangeUserStatusDto } from './user.dto';
import prisma from '@/lib/prisma';
import { generateOtp } from '@/utils/text';
import dayjsExtended from '@/utils/date';
import { ApiError } from '@/lib/errors';

export default class UserService {
  private readonly userMailService = new UserMailService();
  public async emailExists(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return !!user;
  }

  public async createUser(data: any) {
    try {
      const user = await prisma.user.create({
        data,
      });
      return user;
    } catch (error) {
      console.log(error);
      throw new ApiError(400, 'Error creating user');
    }
  }

  public async validateUserCredentials(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (user && bcrypt.compareSync(password, user.password)) {
      return user;
    }
    return null;
  }

  public async sendOtpToUser(email: string) {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    await prisma.user.update({
      where: { email },
      data: {
        otp: otpHash,
        otpExpiry: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    await this.userMailService.optMailSender(email, otp);
  }

  public async verifyOtp(email, providedOtp) {
    const user = await prisma.user.findUnique({ where: { email } });
    const providedOtpHash = crypto
      .createHash('sha256')
      .update(providedOtp)
      .digest('hex');

    return (
      user &&
      user.otp === providedOtpHash &&
      user.otpExpiry &&
      new Date(user.otpExpiry) > new Date()
    );
  }

  public async resetPassword(email, newPassword) {
    const hashedPassword: string = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        otp: null,
        otpExpiry: null,
      },
    });
  }

  public async deleteAccount(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, profile: { select: { fullName: true } } },
    });

    if (!user) throw new ApiError(HttpStatusCode.BadRequest, 'User not found');

    // const userProfileId = user?.profile?.id ?? null;

    // await prisma.damageReport.deleteMany({ where: { userId } });
    // await prisma.order.deleteMany({ where: { userId } });
    // await prisma.payment.deleteMany({ where: { userId } });
    // await prisma.message.deleteMany({
    //   where: { OR: [{ senderId: userId }, { recipientId: userId }] },
    // });
    // await prisma.passwordResetToken.deleteMany({ where: { userId } });
    // await prisma.registrationOrder.deleteMany({ where: { userId } });

    // await prisma.userVerification.deleteMany({
    //   where: { userProfileId },
    // });
    // await prisma.userTokens.deleteMany({
    //   where: { userId },
    // });
    // await prisma.driverLicense.deleteMany({
    //   where: { userProfileId },
    // });
    // await prisma.permitDetails.deleteMany({
    //   where: { userProfileId },
    // });
    // await prisma.driverLicense.deleteMany({
    //   where: { userProfileId },
    // });
    // await prisma.userProfile.deleteMany({ where: { userId } });

    await prisma.user.delete({
      where: { id: userId },
    });

    await this.userMailService.accountDeletedMailSender(
      user?.email!,
      user?.profile?.fullName!
    );
  }

  public async changeUserStatus(data: ChangeUserStatusDto): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: data.userId },
        data: { status: data.status },
      });
    } catch (error) {
      throw new Error('Error updating user status');
    }
  }

  public async fetchUsersByStatus(status: UserStatus): Promise<user[]> {
    try {
      const users = await prisma.user.findMany({
        where: { status },
        include: { profile: true },
      });
      return users;
    } catch (error) {
      throw new Error('Error fetching users');
    }
  }

  public async fetchUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        email: true,
        status: true,
        createdAt: true,
        profile: {
          select: {
            fullName: true,
            profilePhoto: true,
          },
        },
      },
    });
    return user;
  }

  public async sendEmailOtp({
    email,
    userId,
  }: {
    email: string;
    userId: string;
  }) {
    // look for new email exist on db
    const emailExist = await prisma.user.findUnique({ where: { email } });
    if (emailExist) throw new ApiError(400, 'Email exist!');
    // create otp value
    const otp = generateOtp();
    // save otp value on user table
    const emailOtpExpiry = dayjsExtended().add(1, 'h').toDate();
    await prisma.user.update({
      where: { id: userId },
      data: { emailOtp: otp, emailOtpExpiry },
    });
    // send otp to new email
    await this.userMailService.mailOtpMailSender(email, otp);
  }

  public async changeEmail({
    email,
    otp,
    userId,
  }: {
    email: string;
    otp: string;
    userId: string;
  }) {
    // verify otp value
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('No user found!');

    const emailOtp = user.emailOtp;
    const emailOtpExpiry = user.emailOtpExpiry;

    const notValidOtp =
      !emailOtpExpiry ||
      !emailOtp ||
      emailOtp !== otp ||
      emailOtpExpiry < new Date();

    if (notValidOtp) {
      throw new Error('Wrong otp value!');
    }
    // change user email
    await prisma.user.update({
      where: { id: userId },
      data: { email, emailOtp: null, emailOtpExpiry: null },
    });
  }
}
