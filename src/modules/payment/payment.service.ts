import * as mollieClient from '@mollie/api-client';
import { type PaymentStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { REGISTRATION_FEE } from '@/utils/constants';

export default class PaymentService {
  readonly mollie = mollieClient.createMollieClient({
    apiKey: process.env.MOLLIE_API_KEY as string,
  });

  public getAllPayments = async () => {
    const payment = await prisma.payment.findMany();
    return payment;
  };

  public createPayment = async (data: any) => {
    const payment = await prisma.payment.create({ data });
    return payment;
  };

  public updatePayment = async (id: string, data) => {
    const payment = await prisma.payment.update({
      where: { id },
      data,
    });
    return payment;
  };

  public createRegistrationPayment = async (data) => {
    try {
      const payment = await this.mollie.payments.create({
        amount: {
          currency: 'EUR',
          value: REGISTRATION_FEE,
        },
        description: `Order #${data.orderId as string}`,
        redirectUrl: 'your-app://payment-return',
        webhookUrl: 'https://your-api-domain.com/api/payments/webhook',
        metadata: {
          order_id: data.orderId,
        },
      });

      const { id } = await prisma.payment.create({
        data: {
          userId: data.userId,
          amount: parseFloat(payment.amount.value),
          currency: payment.amount.currency,
          orderId: payment.metadata.order_id,
          product: 'REGISTRATION',
          status: 'PENDING',
        },
      });

      return { payment: id, checkoutUrl: payment.getCheckoutUrl() };
    } catch (error) {
      console.error(error);
      throw new Error('Payment creation failed');
    }
  };

  public refundPayment = async (paymentId: string) => {
    try {
      await this.mollie.payments_refunds.create({
        paymentId,
        amount: {
          currency: 'EUR',
          value: REGISTRATION_FEE, // This should be a string, in a '##.##' format
        },
      });
    } catch (error) {
      console.error(error);
      throw new Error('Refund failed');
    }
  };

  public updatePaymentStatus = async (paymentId: string) => {
    try {
      const payment = await this.mollie.payments.get(paymentId);

      await prisma.payment.update({
        where: { orderId: payment.metadata.order_id },
        data: { status: payment.status.toUpperCase() as PaymentStatus },
      });
    } catch (error) {
      console.error(error);
      throw new Error('Failed to update payment status');
    }
  };
}
