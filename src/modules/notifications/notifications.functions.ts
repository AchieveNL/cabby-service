import prisma from '@/lib/prisma';

export const orderConfirmedNotification = async ({
  companyName,
  model,
  orderId,
  userId,
}: {
  userId: string;
  orderId: string;
  companyName: string;
  model: string;
}) => {
  await prisma.notification.create({
    data: {
      event: 'ORDER_CONFIRMED',
      title: 'Bevestiging van reservering',
      content: `Je hebt succesvol de ${companyName} ${model} gereserveerd. Download je kenteken en verzekeringsbewijs vanaf het reserveringstabblad.`,
      userId,
      param: orderId,
    },
  });
};
