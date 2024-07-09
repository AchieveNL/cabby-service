import { NOTIFICATION_EVENT } from '@prisma/client';
import prisma from '@/lib/prisma';
import dayjsExtended from '@/utils/date';

export const orderWillStartQuery = async () => {
  const afterDate = dayjsExtended().add(30, 'minute').toISOString();
  const event = NOTIFICATION_EVENT.ORDER_WILL_START;
  const orders = await prisma.$executeRawUnsafe(`with
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
  result;`);

  return orders;
};

export const orderWillEndQuery = async () => {
  const afterDate = dayjsExtended().add(30, 'minute').toISOString();
  const event = NOTIFICATION_EVENT.ORDER_WILL_END;
  const orders = await prisma.$executeRawUnsafe(`with
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
  result;`);

  return orders;
};
