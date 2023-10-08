import { Router } from 'express';

import users from './users/users.route';
import profile from './profile/profile.route';
import permit from './permit/permit.route';
import payment from './payment/payment.route';
import licence from './licence/licence.route';

const router: Router = Router();

router.use('/users', users);
router.use('/profile', profile);
router.use('/permit', permit);
router.use('/payment', payment);
router.use('/licence', licence);

export default router;
