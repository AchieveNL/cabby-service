// import './utils/date-utils';
import cors from 'cors';
import nocache from 'nocache';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import expressJSDocSwagger from 'express-jsdoc-swagger';
import home from './home';
import environment from './lib/environment';
import expressJSDocSwaggerConfig from './config/express-jsdoc-swagger.config';
import appConfig from './config/app.config';
import teslaAuth from './tesla-auth';
import errorHandler from '@/middlewares/error-handler';
import routes from '@/modules/index.route';
import prismaClient from '@/lib/prisma';
// import { readFile } from 'fs/promises';
// import path, { dirname } from 'path';
// import FileService from './modules/file/file.service';
// import AdminMailService from './modules/notifications/admin-mails.service';
// import UserMailService from './modules/notifications/user-mails.service';
// import { Prisma } from '@prisma/client';
// import prisma from '@/lib/prisma';

export const determineCorsOrigin = () => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return 'https://dashboard.cabbyrentals.com';
    case 'staging':
      return 'https://dashboard-staging.cabbyrentals.com';
    case 'development':
      return 'http://localhost:3000';
    default:
      return '*';
  }
};

class App {
  public express: express.Application;

  constructor() {
    this.express = express();
    this.setMiddlewares();
    this.disableSettings();
    this.setRoutes();
    this.setErrorHandler();
    this.initializeDocs();
  }

  private setMiddlewares(): void {
    this.express.use(morgan('dev'));
    this.express.use(nocache());
    this.express.use(express.json());
    this.express.use(express.urlencoded({ extended: true }));
    this.express.use(helmet());
    this.express.use(cookieParser());
    this.express.use(express.static('public'));

    const corsOptions = {
      origin: determineCorsOrigin(),
      credentials: true,
    };

    this.express.use(cors(corsOptions));
    this.express.options('*', cors(corsOptions));
  }

  private disableSettings(): void {
    this.express.disable('x-powered-by');
  }

  private setRoutes() {
    const {
      api: { version },
    } = appConfig;
    const { env } = environment;
    this.express.use('/', home);
    this.express.use('/tesla', teslaAuth);
    this.express.use(`/api/${version}/${env}`, routes);

    // const adminEmailService = new AdminMailService();
    // const userEmailService = new UserMailService();
    // await adminEmailService.newRegistrationMailSender('test@test.test', 'test');
    // await userEmailService.newRegistrationMailSender('test@test.test', 'test');

    // pdf testing
    // const fileService = new FileService();
    // await fileService.generateAndSaveInvoice(
    //   'a758800b-1a88-4919-9073-d34f583d241d'
    // );
  }

  private setErrorHandler(): void {
    this.express.use(errorHandler);
  }

  private initializeDocs(): void {
    expressJSDocSwagger(this.express)(expressJSDocSwaggerConfig);
  }

  public async connectPrisma(): Promise<void> {
    await prismaClient.$connect();
  }
}

export default App;
