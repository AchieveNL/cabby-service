// import './utils/date-utils';
import cors from 'cors';
import nocache from 'nocache';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import expressJSDocSwagger from 'express-jsdoc-swagger';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import home from './home';
import environment from './lib/environment';
import expressJSDocSwaggerConfig from './config/express-jsdoc-swagger.config';
import appConfig from './config/app.config';
import teslaAuth from './tesla-auth';
import { logsMiddleware } from './middlewares/logs';
import errorHandler from '@/middlewares/error-handler';
import routes from '@/modules/index.route';
import prismaClient from '@/lib/prisma';

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
    this.initializeSentry();
    this.setMiddlewares();
    this.disableSettings();
    this.setRoutes();
    this.setSentryErrorHandler();
    this.setErrorHandler();
    this.initializeDocs();
  }

  private initializeSentry(): void {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      integrations: [nodeProfilingIntegration()],
      // Tracing
      tracesSampleRate: 1.0, //  Capture 100% of the transactions

      // Set sampling rate for profiling - this is relative to tracesSampleRate
      profilesSampleRate: 1.0,
    });
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

  private setSentryErrorHandler(): void {
    Sentry.setupExpressErrorHandler(this.express);
  }

  private disableSettings(): void {
    this.express.disable('x-powered-by');
  }

  private setRoutes() {
    const {
      api: { version },
    } = appConfig;

    const { env } = environment;
    this.express.use(logsMiddleware);
    this.express.use('/', home);
    this.express.use('/tesla', teslaAuth);
    this.express.use(`/api/${version}/${env}`, routes);
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
