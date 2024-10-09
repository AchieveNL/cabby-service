import { Prisma, type order } from '@prisma/client';
import cron from 'node-cron';
import { refreshTeslaApiToken } from '../tesla-auth';
import { mailService } from './mail';
import { fromEmail, isDevelopment, toEmail } from './constants';
import dayjsExtended from './date';
import prisma from '@/lib/prisma';
import OrderMailService from '@/modules/order/order-mails.service';
import { orderConfirmedNotification } from '@/modules/notifications/notifications.functions';
import {
  freeHoursQuery,
  holidaysQuery,
  orderWillEndQuery,
  orderWillStartQuery,
} from '@/modules/notifications/notifications.queries';
import { Mutex } from 'async-mutex';
import { sendToDiscordWebhook } from './helper';

const query = Prisma.sql`SELECT
    o.id,
    o."rentalEndDate",
    o."stopRentDate",
    o."overdueEmailSentDate",
    up."fullName",
    v."licensePlate"
  FROM
    "order" o
    JOIN "user" u ON u.id = o."userId"
    JOIN "userProfile" up ON up."userId" = u.id
    JOIN vehicle v ON v.id = o."vehicleId"
  WHERE
    ("stopRentDate" > "rentalEndDate"
    OR "rentalEndDate" < now())
  AND "overdueEmailSentDate" IS NULL;
`;

type OverdueResult = order & {
  email: string;
  fullName: string;
  licensePlate: string;
};

async function emailSend(payload: OverdueResult[]) {
  const res = await mailService.send(
    payload.map((order) => ({
      to: toEmail,
      from: fromEmail,
      subject: 'Rent Completed - Huur Afgerond',
      text: `Rent Completed - Huur Afgerond

Subject: Huur Verlopen - Actie Vereist

Beste Admin,

We willen je op de hoogte stellen dat de huurperiode van een gebruiker is verlopen. De huurder is ${order.fullName} en ze hebben voertuig ${order.licensePlate} nog niet teruggebracht na het voltooien van hun huurperiode.

Dit is slechts een melding om je op de hoogte te stellen van deze huur. Controleer regelmatig het systeem voor eventuele verdere acties die nodig zijn.

Als je vragen hebt of assistentie nodig hebt, staan we voor je klaar.

Team Cabby`,
    }))
  );

  console.log('Overdue email sent', res);
}

async function updateOverdueOrders() {
  let mark = 0;
  // Get overdue orders
  // const data = await prisma.order.findMany({
  //   include: { user: { include: { profile: true } }, vehicle: true },
  //   where: { overdueEmailSentDate: null, rentalEndDate: { lt: new Date() } },
  // });
  const orders = await prisma.$queryRaw<OverdueResult[]>(query);

  if (orders.length > 0 && !isDevelopment) {
    const ids = orders.map((el) => el.id);
    // Mark overdue orders emails as sent
    // await prisma.order.updateMany({
    //   where: { id: { in: ids } },
    //   data: { overdueEmailSentDate: new Date() },
    // });
    const query2 = Prisma.sql`Update "order" SET "overdueEmailSentDate" = now() where id IN (${Prisma.join(
      ids
    )})`;

    // Send emails of overdue orders to admin
    await emailSend(orders);

    mark = await prisma.$executeRaw(query2);
    console.log('Number of overdue orders rows updated', mark);
  }
}

async function confirmOrderAutomatically() {
  const orderMailService = new OrderMailService();
  const orders = await prisma.order.findMany({
    select: {
      id: true,
      userId: true,
      user: {
        select: { profile: { select: { fullName: true } }, email: true },
      },
      vehicle: {
        select: {
          model: true,
          companyName: true,
          insuranceCertificates: true,
          registrationCertificates: true,
        },
      },
    },
    where: {
      rentalStartDate: {
        lte: dayjsExtended().add(15, 'minute').toDate(),
        gte: dayjsExtended().toDate(),
      },
      status: 'PENDING',
    },
  });

  console.log(orders);

  const updatedOrders = await prisma.order.updateMany({
    where: {
      id: { in: orders.map((el) => el.id) },
    },
    data: { status: 'CONFIRMED' },
  });

  console.log({ updatedOrders });

  await Promise.all(
    orders.map(async (order) => {
      const companyName = order.vehicle.companyName ?? '';
      const model = order.vehicle.model ?? '';
      const orderId = order.id;
      const userId = order.userId;
      await orderConfirmedNotification({ companyName, model, orderId, userId });
      await orderMailService.orderConfirmedMailSender(
        order.user.email,
        order.user.profile?.fullName,
        order.vehicle.insuranceCertificates.concat(
          order.vehicle.registrationCertificates
        )
      );
    })
  );
}

async function orderWillStart() {
  const notifications = await orderWillStartQuery();
  console.log('Orders will start', notifications);
}

async function orderWillEnd() {
  const orders = await orderWillEndQuery();
  console.log('Orders will end', orders);
}

async function freeHours() {
  const result = await freeHoursQuery();
  console.log('Free hours', result);
}

async function holidays() {
  await holidaysQuery();
  console.log('holidays');
}

let teslaTokenRefreshTimeout: NodeJS.Timeout | null = null;
let isTeslaTokenScheduling = false;

const teslaTokenRefreshMutex = new Mutex();

async function scheduleNextTeslaTokenRefresh() {
  if (isTeslaTokenScheduling) {
    console.log('Tesla token refresh is already scheduled.');
    await sendToDiscordWebhook({
      message: 'Tesla token refresh is already scheduled.',
    });
    return;
  }
  isTeslaTokenScheduling = true;

  try {
    const release = await teslaTokenRefreshMutex.acquire();
    try {
      const latestToken = await prisma.teslaToken.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      if (!latestToken) {
        console.log('No Tesla token found in the database');
        isTeslaTokenScheduling = false;
        return;
      }

      const now = Date.now();
      const tokenExpirationTime = latestToken.expiresAt!.getTime();
      const timeUntilExpiration = tokenExpirationTime - now;

      const timeUntilRefresh = Math.max(
        0,
        timeUntilExpiration - 30 * 60 * 1000
      ); // 30 minutes before expiration

      if (teslaTokenRefreshTimeout) {
        clearTimeout(teslaTokenRefreshTimeout);
      }

      teslaTokenRefreshTimeout = setTimeout(async () => {
        try {
          await refreshTeslaApiToken(latestToken.refreshToken);
          console.log('Tesla token refreshed');
          await sendToDiscordWebhook({
            message: `Tesla token refreshed - ${process.env.NODE_ENV}`,
            scheduledTime: new Date(
              Date.now() + timeUntilRefresh
            ).toLocaleString('en-US', { timeZone: 'Europe/London' }),
          });
        } catch (error) {
          await sendToDiscordWebhook({
            message: `Error refreshing Tesla token: ${String(error)} - ${
              process.env.NODE_ENV
            }`,
          });
          console.error('Error refreshing Tesla token:', error);
        } finally {
          isTeslaTokenScheduling = false;
          void scheduleNextTeslaTokenRefresh();
        }
      }, timeUntilRefresh);

      console.log(
        `Next Tesla token refresh scheduled in ${
          timeUntilRefresh / 60000
        } minutes for ${latestToken.id} - ${process.env.NODE_ENV}`
      );

      await sendToDiscordWebhook({
        message: `Next Tesla token refresh scheduled for ${latestToken.id} - ${process.env.NODE_ENV}`,
        scheduledTime: new Date(Date.now() + timeUntilRefresh).toLocaleString(
          'en-US',
          { timeZone: 'Europe/London' }
        ),
      });
    } finally {
      release();
    }
  } catch (error) {
    console.error('Error in scheduleNextTeslaTokenRefresh:', error);
    isTeslaTokenScheduling = false;
  }
}

function cronJobs() {
  if (!isDevelopment) {
    if (process.env.NODE_ENV === 'production') {
      void scheduleNextTeslaTokenRefresh();
    }

    cron.schedule('* * * * *', async () => {
      const functions = [
        updateOverdueOrders,
        confirmOrderAutomatically,
        orderWillStart,
        orderWillEnd,
        freeHours,
        holidays,
      ];

      for (const fn of functions) {
        try {
          await fn();
          console.log(`Running task ${fn.name} at ${new Date().toISOString()}`);
        } catch (error) {
          console.error(`Error in ${fn.name}:`, error);
        }
      }
    });
  }
}

export default cronJobs;
