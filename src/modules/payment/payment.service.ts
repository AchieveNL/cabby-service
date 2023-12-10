import * as mollieClient from '@mollie/api-client';
import {
  RegistrationOrderStatus,
  PaymentStatus,
  PaymentProduct,
} from '@prisma/client';
import { UserStatus } from '../users/types';
import { OrderStatus } from '../order/types';
import FileService from '../file/file.service';
import AdminMailService from '../notifications/admin-mails.service';
import prisma from '@/lib/prisma';
import { REGISTRATION_FEE } from '@/utils/constants';

export default class PaymentService {
  readonly fileService = new FileService();
  readonly adminMailService = new AdminMailService();
  readonly mollie = mollieClient.createMollieClient({
    apiKey: process.env.MOLLIE_API_KEY as string,
  });

  public getAllPayments = async () => {
    const payment = await prisma.payment.findMany();
    return payment;
  };

  public async createOrderPayment({ userId, amount, orderId }) {
    const parameters = this.generateOrderPaymentParameters(amount, orderId);
    const payment = await this.mollie.payments.create(parameters);

    const { id } = await prisma.payment.create({
      data: {
        userId,
        amount: parseFloat(payment.amount.value),
        currency: payment.amount.currency,
        orderId,
        product: PaymentProduct.RENT,
        status: PaymentStatus.PENDING,
      },
    });

    const invoiceUrl = await this.fileService.generateAndSaveInvoice(
      orderId,
      userId,
      id
    );

    await prisma.payment.update({
      where: {
        id,
      },
      data: {
        invoiceUrl,
      },
    });

    return { payment: id, checkoutUrl: payment.getCheckoutUrl() };
  }

  public async updateOrderPaymentStatus(paymentId: string) {
    try {
      const payment = await this.mollie.payments.get(paymentId);
      console.log({ payment });

      const updatedPayment = await prisma.payment.update({
        where: { orderId: payment.metadata.orderId },
        data: { status: payment.status.toUpperCase() as PaymentStatus },
      });

      console.log({ updatedPayment });
      if (updatedPayment.status === PaymentStatus.PAID) {
        const updatedOrders = await prisma.order.update({
          where: { id: payment.metadata.orderId },
          data: {
            status: OrderStatus.PENDING,
          },
        });
        console.log({ updatedOrders });
      }
    } catch (error) {
      console.log({ error });
    }
  }

  public async createCheckoutUrlForOrder(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.status !== OrderStatus.UNPAID) {
      throw new Error('Order not found or already paid.');
    }

    const parameters = this.generateOrderPaymentParameters(
      Number(order.totalAmount),
      orderId
    );

    const payment = await this.mollie.payments.create(parameters);

    return payment.getCheckoutUrl();
  }

  public createRegistrationPayment = async (userId) => {
    const existingRegistrationOrder = await prisma.registrationOrder.findFirst({
      where: {
        userId: userId as string,
      },
    });

    if (
      existingRegistrationOrder &&
      existingRegistrationOrder.status === RegistrationOrderStatus.PAID
    ) {
      return { message: 'Registration order already exists and is PAID.' };
    }

    if (existingRegistrationOrder) {
      await prisma.payment.delete({
        where: {
          registrationOrderId: existingRegistrationOrder.id,
        },
      });

      await prisma.registrationOrder.delete({
        where: {
          userId: userId as string,
        },
      });
    }

    const registrationOrder = await prisma.registrationOrder.create({
      data: {
        userId: userId as string,
        status: RegistrationOrderStatus.PENDING,
        totalAmount: parseFloat(REGISTRATION_FEE),
      },
    });

    const payment = await this.mollie.payments.create({
      amount: {
        currency: 'EUR',
        value: REGISTRATION_FEE,
      },
      description: `Registration Order #${registrationOrder.id}`,
      redirectUrl: 'cabby://registration-payment-completed',
      webhookUrl:
        process.env.NODE_ENV === 'development'
          ? 'https://cabby-service-staging-jtj2mdm6ta-ez.a.run.app/api/v1/staging/payment/registration/webhook'
          : `${process.env.APP_BASE_URL}/api/v1/${process.env.NODE_ENV}/payment/registration/webhook`,
      metadata: {
        registrationOrderId: registrationOrder.id,
      },
    });

    const { id } = await prisma.payment.create({
      data: {
        userId,
        amount: parseFloat(payment.amount.value),
        currency: payment.amount.currency,
        registrationOrderId: registrationOrder.id,
        product: PaymentProduct.REGISTRATION,
        status: PaymentStatus.PENDING,
      },
    });

    return { payment: id, checkoutUrl: payment.getCheckoutUrl() };
  };

  public updateRegistrationPaymentStatus = async (paymentId: string) => {
    const payment = await this.mollie.payments.get(paymentId);

    const updatedPayment = await prisma.payment.update({
      where: { registrationOrderId: payment.metadata.registrationOrderId },
      data: { status: payment.status.toUpperCase() as PaymentStatus },
    });

    await prisma.registrationOrder.update({
      where: {
        id: payment.metadata.registrationOrderId,
      },
      data: {
        status: payment.status.toUpperCase() as PaymentStatus,
      },
    });

    if (updatedPayment.status === PaymentStatus.PAID) {
      const user = await prisma.userProfile.update({
        where: { userId: updatedPayment.userId },
        data: { status: UserStatus.PENDING },
      });
      const userWithEmail = await prisma.user.findUnique({
        where: { id: updatedPayment.userId },
      });
      await this.adminMailService.newRegistrationMailSender(
        userWithEmail?.email!,
        user.fullName
      );
    }

    return true;
  };

  private readonly generateOrderPaymentParameters = (
    totalAmount: number,
    orderId: string
  ) => {
    return {
      amount: {
        currency: 'EUR',
        value: totalAmount.toFixed(2),
      },
      description: `Payment for Order #${orderId}`,
      redirectUrl: 'cabby://order-payment-completed',
      webhookUrl:
        process.env.NODE_ENV === 'development'
          ? 'https://cabby-service-staging-jtj2mdm6ta-ez.a.run.app/api/v1/staging/payment/order/webhook'
          : `${process.env.APP_BASE_URL}/api/v1/${process.env.NODE_ENV}/payment/order/webhook`,
      metadata: {
        orderId,
      },
    };
  };
}
