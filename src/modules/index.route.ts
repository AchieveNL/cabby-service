import { Router } from 'express';

import users from './users/users.route';
import profile from './profile/profile.route';
import permit from './permit/permit.route';
import payment from './payment/payment.route';
import licence from './licence/licence.route';
import orders from './order/order.route';
import files from './file/file.route';
import vehicles from './vehicle/vehicle.route';
import overview from './overview/overview.route';
import damageReports from './damage-reports/damage-reports.route';
import messages from './message/message.route';
import thirdParty from './third-party/third-party.route';
import notification from './notifications/notifications.route';
import refunds from './refunds/refunds.route';

const router: Router = Router();

router.use('/users', users);
router.use('/profile', profile);
router.use('/permit', permit);
router.use('/payment', payment);
router.use('/licence', licence);
router.use('/orders', orders);
router.use('/files', files);
router.use('/vehicles', vehicles);
router.use('/overview', overview);
router.use('/damage-reports', damageReports);
router.use('/messages', messages);
router.use('/third-party', thirdParty);
router.use('/notification', notification);
router.use('/refunds', refunds);

export default router;
