import * as mollieClient from '@mollie/api-client';
import {
  RegistrationOrderStatus,
  PaymentStatus,
  PaymentProduct,
} from '@prisma/client';
import { UserStatus } from '../users/types';
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
    // Create a registration order
    const registrationOrder = await prisma.registrationOrder.create({
      data: {
        userId: data.userId as string,
        status: RegistrationOrderStatus.PENDING,
        totalAmount: parseFloat(REGISTRATION_FEE),
      },
    });

    // Make a payment using Mollie
    const payment = await this.mollie.payments.create({
      amount: {
        currency: 'EUR',
        value: REGISTRATION_FEE,
      },
      description: `Registration Order #${registrationOrder.id}`,
      redirectUrl: 'cabby://registration-payment-completed',
      webhookUrl: `https://cabby-service-staging-jtj2mdm6ta-ez.a.run.app/api/v1/staging/payment/registration/webhook`,
      metadata: {
        registrationOrderId: registrationOrder.id, // Using registrationOrderId instead of orderId
      },
    });

    // Store the payment in the database
    const { id } = await prisma.payment.create({
      data: {
        userId: data.userId,
        amount: parseFloat(payment.amount.value),
        currency: payment.amount.currency,
        registrationOrderId: registrationOrder.id, // Linking to registrationOrder
        product: PaymentProduct.REGISTRATION,
        status: PaymentStatus.PENDING,
      },
    });

    return { payment: id, checkoutUrl: payment.getCheckoutUrl() };
  };

  public refundPayment = async (paymentId: string) => {
    try {
      await this.mollie.payments_refunds.create({
        paymentId,
        amount: {
          currency: 'EUR',
          value: REGISTRATION_FEE,
        },
      });
    } catch (error) {
      console.error(error);
      throw new Error('Refund failed');
    }
  };

  public updateRegistrationPaymentStatus = async (paymentId: string) => {
    const payment = await this.mollie.payments.get(paymentId);

    const updatedPayment = await prisma.payment.update({
      where: { registrationOrderId: payment.metadata.registrationOrderId },
      data: { status: payment.status.toUpperCase() as PaymentStatus },
    });

    if (updatedPayment.status === PaymentStatus.PAID) {
      await prisma.userProfile.update({
        where: { userId: updatedPayment.userId },
        data: { status: UserStatus.PENDING },
      });
    }

    return true;
  };
}
