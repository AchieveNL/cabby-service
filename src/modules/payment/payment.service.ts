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
import UserMailService from '../notifications/user-mails.service';
import prisma from '@/lib/prisma';
import { REGISTRATION_FEE } from '@/utils/constants';
import { HttpBadRequestError } from '@/lib/errors';
import * as Sentry from '@sentry/node';

export default class PaymentService {
  readonly fileService = new FileService();
  readonly adminMailService = new AdminMailService();
  readonly userMailService = new UserMailService();
  readonly mollie = mollieClient.createMollieClient({
    apiKey: process.env.MOLLIE_API_KEY as string,
  });

  public async refundPayment(paymentId: string) {
    if (!paymentId) throw new HttpBadRequestError('Must provide payment id');

    const payment = await prisma.payment.findUnique({
      where: { mollieId: paymentId },
      include: {
        user: {
          include: { profile: true },
        },
      },
    });

    if (!payment) throw new HttpBadRequestError("Payment doesn't exist");

    const value = payment?.amount.toFixed(2)!;
    console.log(payment, value);
    const refund = await this.mollie.paymentRefunds.create({
      paymentId,
      amount: {
        currency: 'EUR',
        value,
      },
    });

    console.log(refund);

    const res = await prisma.payment.update({
      where: { mollieId: paymentId },
      data: { status: 'REFUNDED' },
    });

    const email = payment.user.email;
    const name = payment.user.profile?.fullName!;

    await this.userMailService.paymentRefundedMailSender(email, name);

    return { res, refund };
  }

  public getAllPayments = async () => {
    const payment = await prisma.payment.findMany();
    return payment;
  };

  public async createOrderPayment({
    userId,
    amount,
    orderId,
    status = PaymentStatus.PENDING,
  }: {
    userId: string;
    amount: number;
    orderId: string;
    status?: PaymentStatus;
  }) {
    const parameters = this.generateOrderPaymentParameters(amount, orderId);
    const payment = await this.mollie.payments.create(parameters);
    const checkoutUrl = payment.getCheckoutUrl();
    console.log('payment', payment, checkoutUrl);

    const { id } = await prisma.payment.create({
      data: {
        mollieId: payment.id,
        userId,
        amount: parseFloat(payment.amount.value),
        currency: payment.amount.currency,
        orderId,
        product: PaymentProduct.RENT,
        status,
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

    return { payment: id, checkoutUrl };
  }

  public async updateOrderPaymentStatus(paymentId: string) {
    try {
      const payment = await this.mollie.payments.get(paymentId);

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

    console.log('existingRegistrationOrder: ', existingRegistrationOrder);

    const deposit = await prisma.settings.findUnique({
      where: { key: 'deposit' },
    });

    console.log('deposit: ', deposit);

    const fees = deposit?.value
      ? Number(deposit?.value).toFixed(2)
      : REGISTRATION_FEE;

    console.log('fees: ' + fees);

    const invoiceUrl = await this.fileService.generateAndSaveDepositInvoice({
      userId,
    });

    console.log('invoiceUrl: ' + invoiceUrl);

    const registrationOrder = await prisma.registrationOrder.create({
      data: {
        userId: userId as string,
        status: RegistrationOrderStatus.PENDING,
        totalAmount: parseFloat(fees),
        invoiceUrl,
      },
    });

    console.log('registrationOrder: ', registrationOrder);

    const payment = await this.mollie.payments.create({
      amount: {
        currency: 'EUR',
        value: fees,
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

    console.log('payment: ', payment);

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

    await prisma.registrationOrder.update({
      where: { id: registrationOrder.id },
      data: {
        paymentId: payment.id,
        payment: { update: { mollieId: payment.id } },
      },
    });

    console.log('id: ', id);

    return { payment: id, checkoutUrl: payment.getCheckoutUrl() };
  };

  public updateRegistrationPaymentStatus = async (paymentId: string) => {
    const payment = await this.mollie.payments.get(paymentId);
    Sentry.captureMessage('payment: ' + payment, 'info');

    const updatedPayment = await prisma.payment.update({
      where: { registrationOrderId: payment.metadata.registrationOrderId },
      data: { status: payment.status.toUpperCase() as PaymentStatus },
    });

    const { invoiceUrl } = await prisma.registrationOrder.update({
      where: {
        id: payment.metadata.registrationOrderId,
      },
      data: {
        status: payment.status.toUpperCase() as PaymentStatus,
      },
    });

    if (updatedPayment.status === PaymentStatus.PAID) {
      const userId = updatedPayment.userId;
      const userProfile = await prisma.userProfile.update({
        where: { userId },
        data: { status: UserStatus.PENDING },
        include: { user: { select: { email: true } } },
      });
      const email = userProfile.user.email;
      const fullName = userProfile.fullName;
      await this.adminMailService.newRegistrationMailSender(email, fullName);
      await this.userMailService.newRegistrationMailSender(
        email,
        fullName,
        invoiceUrl as string
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
