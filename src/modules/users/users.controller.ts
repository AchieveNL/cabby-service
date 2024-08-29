import { UserRole, type user } from '@prisma/client';
import { HttpStatusCode } from 'axios';
import bcrypt from 'bcrypt';
import { type Response, type NextFunction, type Request } from 'express';
import { z } from 'zod';
import ProfileService from '../profile/profile.service';
import {
  type LoginDto,
  type CreateUserDto,
  type sendEmailOtp,
  type changeEmail,
  type RequestPasswordResetDto,
  type ResetPasswordDto,
} from './user.dto';
import UserService from './users.service';
import { UserStatus } from './types';
import { type CustomResponse } from '@/types/common.type';
import Api from '@/lib/api';
import {
  generateRefreshToken,
  generateToken,
} from '@/middlewares/token-manager';
import { setAuthCookies } from '@/middlewares/cookies';
import { emailSchema } from '@/schemas';
import prisma from '@/lib/prisma';

export default class UserController extends Api {
  private readonly userService = new UserService();
  private readonly userProfileService = new ProfileService();

  public checkEmailAvailability = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const email = emailSchema.parse(req.query.email);
      const isAvailable = await this.userService.emailExists(email);
      this.send(
        res,
        { isAvailable },
        HttpStatusCode.Ok,
        isAvailable ? 'Email is available' : 'Email is not available'
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.send(res, null, HttpStatusCode.BadRequest, 'Invalid email');
      } else {
        this.send(res, null, HttpStatusCode.BadRequest, 'Error checking email');
      }
    }
  };

  public userStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const status = await this.userProfileService.getUserProfileStatusByUserId(
        req.user?.id
      );
      this.send(res, status, HttpStatusCode.Ok, 'User status');
    } catch (e) {
      next(e);
    }
  };

  public signup = async (
    req: Request,
    res: CustomResponse<user>,
    next: NextFunction
  ) => {
    try {
      const userData: CreateUserDto = req.body;

      const hashedPassword: string = await bcrypt.hash(userData.password, 10);

      const email = userData.email.toLowerCase();
      const user = await this.userService.createUser({
        ...userData,
        email,
        password: hashedPassword,
        status: UserStatus.PENDING,
      });

      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      setAuthCookies(res, token, refreshToken);

      this.send(res, { user, token }, HttpStatusCode.Created, 'signup');
    } catch (e) {
      console.log(e);
      next(e);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as LoginDto;

      const emailLowerCase = email.toLowerCase();
      const user = await this.userService.validateUserCredentials(
        emailLowerCase,
        password
      );

      if (!user) {
        return this.send(
          res,
          null,
          HttpStatusCode.BadRequest,
          'Ongeldig e-mailadres of wachtwoord'
        );
      }

      if (user?.role !== UserRole.ADMIN) {
        return this.send(
          res,
          null,
          HttpStatusCode.BadRequest,
          'Ongeldig e-mailadres of wachtwoord'
        );
      }

      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      setAuthCookies(res, token, refreshToken);

      return res.status(HttpStatusCode.Ok).json({ user });
    } catch (e) {
      next(e);
    }
  };

  public mobileLogin = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { email, password } = req.body as LoginDto;
      // console all users:
      // create a user:
      // const hashedPassword: string = await bcrypt.hash('Foundever@2024', 10);
      // await prisma.user.update({
      //   where: {
      //     email: 'naziha.bahraoui@gmail.com',
      //   },
      //   data: {
      //     // email: 'test@test.com',
      //     // password: hashedPassword,
      //     role: 'USER',
      //     status: 'ACTIVE',
      //     profile: {
      //       create: {
      //         fullName: 'Naziha Bahraoui',
      //         lastName: 'Bahraoui',
      //         firstName: 'Naziha',
      //         phoneNumber: '1234567890',
      //         fullAddress: '1234 Main St, New York, NY 10001',
      //         city: 'New York',
      //         status: 'ACTIVE',
      //       },
      //     },
      //   },
      // });

      const user = await this.userService.validateUserCredentials(
        email.toLowerCase(),
        password
      );

      if (user?.status === 'DEACTIVATED') {
        return this.send(
          res,
          null,
          HttpStatusCode.BadRequest,
          'Ongeldig e-mailadres of wachtwoord'
        );
      }

      if (!user) {
        return this.send(
          res,
          null,
          HttpStatusCode.BadRequest,
          'Ongeldig e-mailadres of wachtwoord'
        );
      }

      if (user.role !== UserRole.USER) {
        return this.send(
          res,
          null,
          HttpStatusCode.BadRequest,
          'Ongeldig e-mailadres of wachtwoord'
        );
      }

      const status = await this.userProfileService.getUserProfileStatusByUserId(
        user.id
      );

      const minimalUser = {
        id: user.id,
        email: user.email,
        role: user.role,
        status,
      };

      if (status) {
        if (status === 'PENDING') {
          return this.send(
            res,
            minimalUser,
            HttpStatusCode.Ok,
            'Your account is still pending approval'
          );
        }

        if (status === 'BLOCKED') {
          return this.send(
            res,
            minimalUser,
            HttpStatusCode.Ok,
            'Your account has been blocked. Please contact the admin for more details.'
          );
        }

        if (user.status === 'REJECTED') {
          return this.send(
            res,
            minimalUser,
            HttpStatusCode.Ok,
            'Your account has been rejected. Please contact the admin for more details.'
          );
        }

        const token = generateToken(minimalUser);
        const refreshToken = generateRefreshToken(minimalUser);

        setAuthCookies(res, token, refreshToken);

        return this.send(
          res,
          minimalUser,
          HttpStatusCode.Ok,
          'Login successful'
        );
      }

      return this.send(
        res,
        null,
        HttpStatusCode.BadRequest,
        'You are not registered'
      );
    } catch (e) {
      next(e);
    }
  };

  public requestPasswordReset = async (req, res, next) => {
    try {
      const body = req.body as RequestPasswordResetDto;
      const email = body.email?.toLowerCase();
      await this.userService.sendOtpToUser(email);
      this.send(res, {}, HttpStatusCode.Ok, 'OTP sent to email');
    } catch (e) {
      next(e);
    }
  };

  public verifyOtp = async (req, res, next) => {
    try {
      const isValidOtp = await this.userService.verifyOtp(
        req.body.email,
        req.body.otp
      );
      this.send(
        res,
        {},
        isValidOtp ? HttpStatusCode.Ok : HttpStatusCode.BadRequest,
        isValidOtp ? 'OTP verified' : 'Invalid OTP'
      );
    } catch (e) {
      next(e);
    }
  };

  public resetPassword = async (req, res, next) => {
    const body = req.body as ResetPasswordDto;
    try {
      await this.userService.resetPassword(
        body.email.toLowerCase(),
        body.newPassword
      );
      this.send(res, {}, HttpStatusCode.Ok, 'Password updated successfully');
    } catch (e) {
      next(e);
    }
  };

  public deleteAccount = async (
    req: Request,
    res: CustomResponse<user>,
    next: NextFunction
  ) => {
    try {
      const isAdmin = req.user?.role === UserRole.ADMIN;
      const userId = isAdmin ? req.body.userId : req.user?.id;

      await this.userService.deleteAccount(userId);
      this.send(res, null, HttpStatusCode.Ok, 'Account deleted successfully');
    } catch (e) {
      next(e);
    }
  };

  public changeUserStatus = async (
    req: Request,
    res: CustomResponse<user>,
    next: NextFunction
  ) => {
    try {
      await this.userService.changeUserStatus(req.body);
      this.send(
        res,
        null,
        HttpStatusCode.Ok,
        'User status updated successfully'
      );
    } catch (e) {
      next(e);
    }
  };

  public fetchUsersByStatus = async (
    req: Request,
    res: CustomResponse<user[]>,
    next: NextFunction
  ) => {
    try {
      const users = await this.userService.fetchUsersByStatus(
        req.query.status as UserStatus
      );
      this.send(
        res,
        users,
        HttpStatusCode.Ok,
        `${users.length} users fetched successfully`
      );
    } catch (e) {
      next(e);
    }
  };

  public fetchCurrentUser = async (
    req: Request,
    res: CustomResponse<user>,
    next: NextFunction
  ) => {
    try {
      const user = await this.userService.fetchUserById(req.user?.id);
      this.send(res, user, HttpStatusCode.Ok, `user fetched successfully`);
    } catch (e) {
      next(e);
    }
  };

  public fetchUserById = async (
    req: Request,
    res: CustomResponse<user>,
    next: NextFunction
  ) => {
    try {
      const users = await this.userService.fetchUserById(req.params.id);
      this.send(res, users, HttpStatusCode.Ok, `user fetched successfully`);
    } catch (e) {
      next(e);
    }
  };

  public sendEmailOtp = async (
    req: Request,
    res: CustomResponse<user>,
    next: NextFunction
  ) => {
    try {
      const body = req.body as sendEmailOtp;
      const email = body.email.toLowerCase();
      const userId = req.user?.id;
      await this.userService.sendEmailOtp({ email, userId });
      this.send(res, 'Done', HttpStatusCode.Ok, `Otp sent successfully`);
    } catch (e) {
      next(e);
    }
  };

  public changeEmail = async (
    req: Request,
    res: CustomResponse<user>,
    next: NextFunction
  ) => {
    try {
      const { email, otp } = req.body as changeEmail;
      const userId = req.user?.id;
      await this.userService.changeEmail({
        email: email.toLowerCase(),
        userId,
        otp,
      });
      this.send(res, 'Done', HttpStatusCode.Ok, `Email changed successfully`);
    } catch (e) {
      next(e);
    }
  };
}
