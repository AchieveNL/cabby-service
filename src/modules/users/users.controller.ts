import { UserRole, type user } from '@prisma/client';
import { HttpStatusCode } from 'axios';
import bcrypt from 'bcrypt';
import { type Response, type NextFunction, type Request } from 'express';
import ProfileService from '../profile/profile.service';
import { type LoginDto, type CreateUserDto } from './user.dto';
import UserService from './users.service';
import { UserStatus } from './types';
import { type CustomResponse } from '@/types/common.type';
import Api from '@/lib/api';
import {
  generateRefreshToken,
  generateToken,
} from '@/middlewares/token-manager';
import { setAuthCookies } from '@/middlewares/cookies';

export default class UserController extends Api {
  private readonly userService = new UserService();
  private readonly userProfileService = new ProfileService();

  public emailExists = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const emailExists = await this.userService.emailExists(
        req.query.email as string
      );
      this.send(res, { emailExists }, HttpStatusCode.Ok, 'Email exists');
    } catch (e) {
      next(e);
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

      const user = await this.userService.createUser({
        ...userData,
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

      const user = await this.userService.validateUserCredentials(
        email,
        password
      );

      if (!user) {
        return this.send(
          res,
          null,
          HttpStatusCode.BadRequest,
          'Invalid email or password'
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

      const user = await this.userService.validateUserCredentials(
        email,
        password
      );

      if (user?.status === 'DEACTIVATED') {
        return this.send(
          res,
          null,
          HttpStatusCode.BadRequest,
          'Invalid email or password'
        );
      }

      if (!user) {
        return this.send(
          res,
          null,
          HttpStatusCode.BadRequest,
          'Invalid email or password'
        );
      }

      if (user.role !== UserRole.USER) {
        return this.send(
          res,
          null,
          HttpStatusCode.BadRequest,
          'Invalid email or password'
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
      await this.userService.sendOtpToUser(req.body.email);
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
    try {
      await this.userService.resetPassword(
        req.body.email,
        req.body.newPassword
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
      await this.userService.deleteAccount(req.user?.id);
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
}
