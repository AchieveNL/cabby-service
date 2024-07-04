import { Prisma, type order } from '@prisma/client';
import cron from 'node-cron';
import { mailService } from './mail';
import { fromEmail, isDevelopment, toEmail } from './constants';
import dayjsExtended from './date';
import prisma from '@/lib/prisma';
import OrderMailService from '@/modules/order/order-mails.service';

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

    // Send emails of overdue orders to admin
    await emailSend(orders);

    // Mark overdue orders emails as sent
    // await prisma.order.updateMany({
    //   where: { id: { in: ids } },
    //   data: { overdueEmailSentDate: new Date() },
    // });
    const query2 = Prisma.sql`Update "order" SET "overdueEmailSentDate" = now() where id IN (${Prisma.join(
      ids
    )})`;

    mark = await prisma.$executeRaw(query2);
    console.log('Number of overdue orders rows updated', mark);
  }
}

async function confirmOrderAutomatically() {
  const orderMailService = new OrderMailService();
  const orders = await prisma.order.findMany({
    where: {
      rentalStartDate: { gte: dayjsExtended().subtract(15, 'minute').toDate() },
      status: 'PENDING',
    },
    include: { user: { include: { profile: true } }, vehicle: true },
  });
  // console.log({ orders });
  const updatedOrders = await prisma.order.updateMany({
    where: {
      id: { in: orders.map((el) => el.id) },
    },
    data: { status: 'CONFIRMED' },
  });

  console.log({ updatedOrders });

  await Promise.all(
    orders.map(async (order) => {
      await orderMailService.orderConfirmedMailSender(
        order.user.email,
        order.user.profile?.fullName,
        order.vehicle.papers
      );
    })
  );
}

// async function sendNotification() {
//   const users = await prisma.user.findMany({
//     select: { id: true },
//     where: { profile: { permitDetails: {} } },
//   });
//   await prisma.notification.create({
//     data: {
//       users: { connect: users },
//       content: 'content',
//       title: 'title',
//     },
//   });
// }

function cronJobs() {
  if (!isDevelopment) {
    return cron.schedule('* * * * *', async () => {
      try {
        await updateOverdueOrders();
        await confirmOrderAutomatically();
        // console.log('running a task every minute', new Date());
      } catch (error) {
        console.log('Error', error);
      }
    });
  }
}

export default cronJobs;
