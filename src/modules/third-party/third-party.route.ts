import { Router } from 'express';
import { ThirdPartyController } from './third-party.controller';
import { requireAuth, verifyAuthToken } from '@/middlewares/auth';

const thirdParty: Router = Router();
const controller = new ThirdPartyController();

thirdParty.get(
  '/verify-user-info',
  verifyAuthToken,
  requireAuth,
  controller.verifyUserInfo
);

thirdParty.get('/verify-user-info/:id', controller.verifyUserInfoById);

export default thirdParty;
