import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { type UserStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { type ChangeUserStatusDto } from './user.dto';
import prisma from '@/lib/prisma';

export default class UserService {
  public async createUser(data: any) {
    try {
      const user = await prisma.users.create({
        data,
      });
      return user;
    } catch (error) {
      console.log(error);
      throw new Error('Error creating user');
    }
  }

  public async validateUserCredentials(email: string, password: string) {
    const user = await prisma.users.findUnique({
      where: { email },
    });
    if (user && bcrypt.compareSync(password, user.password)) {
      return user;
    }
    return null;
  }

  public async initiatePasswordReset(email: string) {
    // Find the user with the given email
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) throw new Error('User not found');

    // Generate a reset token and save it to the database with an expiration time
    const token = uuidv4();
    // Store token in DB associated with the user. Ensure it expires reasonably soon for security.

    // You might create a separate model to store password reset tokens
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiry: new Date(Date.now() + 3600000) }, // 1 hour expiry
    });

    // Send email with reset link including token
    const msg = {
      to: email,
      from: 'your-email@example.com',
      subject: 'Password Reset',
      text: `Click the following link to reset your password: ${process.env.FRONTEND_URL}/reset-password/${token}`,
    };
    await sgMail.send(msg);
  }

  public async performPasswordReset(token: string, newPassword: string) {
    // Find the token in the database and ensure it's not expired
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });
    if (!resetToken || new Date() > resetToken.expiry)
      throw new Error('Invalid or expired token');

    // Hash the new password and set it for the associated user
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.users.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // Invalidate the reset token
    await prisma.passwordResetToken.delete({ where: { token } });
  }

  public async sendOtpToUser(email) {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    await prisma.users.update({
      where: { email },
      data: {
        otp: otpHash,
        otpExpiry: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
    // ... send email logic...
  }

  public async verifyOtp(email, providedOtp) {
    const user = await prisma.users.findUnique({ where: { email } });
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
    await prisma.users.update({
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
      await prisma.users.delete({ where: { id: userId } });
    } catch (error) {
      throw new Error('Error deleting account');
    }
  }

  public async changeUserStatus(data: ChangeUserStatusDto): Promise<void> {
    try {
      await prisma.users.update({
        where: { id: data.userId },
        data: { status: data.status },
      });
    } catch (error) {
      throw new Error('Error updating user status');
    }
  }

  public async fetchUsersByStatus(status: UserStatus): Promise<users[]> {
    try {
      const users = await prisma.users.findMany({
        where: { status },
        include: { profile: true },
      });
      return users;
    } catch (error) {
      throw new Error('Error fetching users');
    }
  }
}
