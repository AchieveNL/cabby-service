import { type Notification, NOTIFICATION_EVENT } from '@prisma/client';
import { NotificationService } from './notification.service';
import prisma from '@/lib/prisma';
import dayjsExtended, {
  getChristmas,
  getEaster,
  getKingsDay,
  getNewYearsEve,
  getWhitsun,
} from '@/utils/date';

const notificationService = new NotificationService();

async function sendMultipleNotifications(notifications: Notification[]) {
  await Promise.all(
    notifications.map(async (el) => {
      console.log(el);
      await notificationService.sendNotificationToUser(
        el.userId || '',
        el.title || '',
        el.content || '',
        JSON.stringify({})
      );
    })
  );
}

export const orderWillStartQuery = async () => {
  const afterDate = dayjsExtended().add(30, 'minute').toISOString();
  const event = NOTIFICATION_EVENT.ORDER_WILL_START;
  const notifications = await prisma.$queryRawUnsafe<Notification[]>(`with
  result as (
    select distinct
      '${event}'::"NOTIFICATION_EVENT" event,
      o."userId",
      o.id param,
      'Herinnering: Geplande reservering' title,
      CONCAT_WS(
        ' ',
        'Je hebt een geplande reservering. Vergeet niet de',
        v."companyName",
        v.model,
        'op te halen.'
      ) content
    from
      "order" o
      join "vehicle" v on v.id = o."vehicleId"
    where
      o."rentalStartDate" BETWEEN now() and '${afterDate}'
      and o.id not in (
        select
          o.id
        from
          "order" o
          join "Notification" n on n.param = o.id
          and n.event = '${event}'
          and n."userId" = o."userId"
      )
  )
insert into
  "Notification" (event, "userId", param, title, content)
select
  *
from
  result 
returning
  *;`);

  await sendMultipleNotifications(notifications);

  return notifications;
};

export const orderWillEndQuery = async () => {
  const afterDate = dayjsExtended().add(30, 'minute').toISOString();
  const event = NOTIFICATION_EVENT.ORDER_WILL_END;
  const notifications = await prisma.$queryRawUnsafe<Notification[]>(`with
  result as (
    select distinct
      '${event}'::"NOTIFICATION_EVENT" event,
      o."userId",
      o.id param,
      'Herinnering: Auto terugbrengen' title,
      CONCAT_WS(
        ' ',
        'Je rit eindigt over 30 minuten. Vergeet niet de',
        v."companyName",
        v.model,
        'terug te brengen naar de aangewezen locatie of laat hem achter op de bestemming.'
      ) content
    from
      "order" o
      join "vehicle" v on v.id = o."vehicleId"
    where
      o."rentalEndDate" BETWEEN now() and '${afterDate}'
      and o.id not in (
        select
          o.id
        from
          "order" o
          join "Notification" n on n.param = o.id
          and n.event = '${event}'
          and n."userId" = o."userId"
      )
  )
insert into
  "Notification" (event, "userId", param, title, content)
select
  *
from
  result 
returning
  *;`);

  await sendMultipleNotifications(notifications);

  return notifications;
};

export const freeHoursQuery = async () => {
  const result = await prisma.$executeRaw`with
  result as (
    SELECT DISTINCT
      "userId"
    FROM
      (
        SELECT
          "userId",
          DATE_TRUNC('week', "rentalStartDate") AS week_start,
          SUM("rentalEndDate" - "rentalStartDate") AS duration
        FROM
          "order"
        GROUP BY
          "userId",
          "vehicleId",
          DATE_TRUNC('week', "rentalStartDate")
        HAVING
          SUM("rentalEndDate" - "rentalStartDate") > interval '20 hours'
      ) AS subquery
    where
      "userId" not in (
        select
          "userId"
        from
          "Notification" n
        where
          n.event = 'FREE_HOURS'
      )
  )
insert into
  "Notification" ("userId", event, title, content)
select
  "userId",
  'FREE_HOURS',
  'Gratis 5 uur extra ontvangen?',
  'Heb je deze week al 20 uur gehuurd? Stuur ons een bericht dan ontvang je 5 uur extra van ons.'
from
  result;`;

  return result;
};

export const holidaysQuery = async () => {
  const easter = getEaster();
  const christmas = getChristmas();
  const kingsDay = getKingsDay();
  const newYearsEve = getNewYearsEve();
  const whitsun = getWhitsun();

  console.log(easter, christmas, kingsDay, newYearsEve, whitsun);
};
