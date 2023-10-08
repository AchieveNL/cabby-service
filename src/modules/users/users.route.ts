import { Router } from 'express';
import Controller from './users.controller';
import {
  ChangeUserStatusDto,
  CreateUserDto,
  FetchUsersByStatusDto,
  PerformPasswordResetDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
  ResetPasswordInitiateDto,
  VerifyOtpDto,
} from '@/modules/users/user.dto';
import RequestValidator from '@/middlewares/request-validator';
import { requireAdmin, requireAuth, verifyAuthToken } from '@/middlewares/auth';

const users: Router = Router();
const controller = new Controller();

users.post(
  '/signup',
  RequestValidator.validate(CreateUserDto),
  controller.signup
);

users.post(
  '/reset-password/initiate',
  RequestValidator.validate(ResetPasswordInitiateDto),
  controller.initiateResetPassword
);

users.post(
  '/reset-password/perform',
  RequestValidator.validate(PerformPasswordResetDto),
  controller.performPasswordReset
);

users.post(
  '/request-password-reset',
  RequestValidator.validate(RequestPasswordResetDto),
  controller.requestPasswordReset
);

users.post(
  '/verify-otp',
  RequestValidator.validate(VerifyOtpDto),
  controller.verifyOtp
);

users.post(
  '/reset-password',
  RequestValidator.validate(ResetPasswordDto),
  controller.resetPassword
);

users.delete(
  '/delete-account',
  verifyAuthToken,
  requireAuth,
  controller.deleteAccount
);

users.patch(
  '/change-status',
  verifyAuthToken,
  requireAuth,
  requireAdmin,
  RequestValidator.validate(ChangeUserStatusDto),
  controller.changeUserStatus
);

users.get(
  '/',
  verifyAuthToken,
  requireAuth,
  requireAdmin,
  RequestValidator.validateQuery(FetchUsersByStatusDto),
  controller.fetchUsersByStatus
);

export default users;
