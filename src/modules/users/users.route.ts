import { Router } from 'express';
import Controller from './users.controller';
import {
  ChangeUserStatusDto,
  CreateUserDto,
  FetchUsersByStatusDto,
  LoginDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
  VerifyOtpDto,
} from '@/modules/users/user.dto';
import RequestValidator from '@/middlewares/request-validator';
import { requireAdmin, requireAuth, verifyAuthToken } from '@/middlewares/auth';
import { mailSender } from '@/config/mailer.config';

const users: Router = Router();
const controller = new Controller();

users.post(
  '/signup',
  RequestValidator.validate(CreateUserDto),
  controller.signup
);

users.post('/login', RequestValidator.validate(LoginDto), controller.login);

users.post(
  '/mobile-login',
  RequestValidator.validate(LoginDto),
  controller.mobileLogin
);

users.get('/email-exists', controller.emailExists);

users.get('/status', verifyAuthToken, requireAuth, controller.userStatus);

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

users.get(
  '/current',
  verifyAuthToken,
  requireAuth,
  controller.fetchCurrentUser
);

users.get('/:id', verifyAuthToken, requireAuth, controller.fetchUserById);

users.get('/send-mail', async (req, res) => {
  const mailMessage = {
    to: 'no-reply@cabbyrentals.nl',
    subject: 'Nieuwe Registratie - Actie Vereist',
    text: `Nieuwe Registratie - Actie Vereist`,
    html: `
    Beste Admin,

    Er heeft zich zojuist een nieuwe gebruiker geregistreerd op het Cabby-platform. De naam van de nieuwe gebruiker is any en ze hebben succesvol hun registratieproces voltooid.

    We willen je op de hoogte stellen van deze nieuwe registratie zodat je actie kunt ondernemen om hun registratie te verifiëren en goed te keuren. Controleer de ingediende gegevens om ervoor te zorgen dat alles in orde is.
    
    Als je vragen hebt of verdere informatie nodig hebt, laat het ons dan weten.
    Team Cabby
`,
  };

  await mailSender(mailMessage);
  res.send('Hello');
});
export default users;
