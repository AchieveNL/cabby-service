import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { type user, type UserStatus } from '@prisma/client';
import { type ChangeUserStatusDto } from './user.dto';
import prisma from '@/lib/prisma';
import { mailService } from '@/utils/mail';

export default class UserService {
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
      throw new Error('Error creating user');
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

    const msg = {
      to: email,
      from: 'info@cabbyrentals.com',
      subject: 'Your OTP for Cabby Rentals',
      text: `Your OTP for Cabby Rentals is: ${otp}. It will expire in 15 minutes.`,
      html: `
        <strong>Your OTP for Cabby Rentals is:</strong> 
        <h2>${otp}</h2>
        <p>This OTP will expire in 15 minutes.</p>
      `,
    };

    try {
      console.log('OTP email sent successfully.', otp);
      await mailService.send(msg);
    } catch (error) {
      console.error('Error sending OTP email: ', error);
    }
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
    try {
      await prisma.user.delete({ where: { id: userId } });
    } catch (error) {
      throw new Error('Error deleting account');
    }
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
}
