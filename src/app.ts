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
// import axios from 'axios';
// import OrderService from './modules/order/order.service';

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
    if (process.env.NODE_ENV !== 'development') {
      this.initializeSentry();
    }
    this.setMiddlewares();
    this.disableSettings();
    this.setRoutes();
    if (process.env.NODE_ENV !== 'development') {
      this.setSentryErrorHandler();
    }
    this.setErrorHandler();
    this.initializeDocs();
  }

  private initializeSentry(): void {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      integrations: [nodeProfilingIntegration()],
      environment: process.env.NODE_ENV,
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
    // const orderService = new OrderService();
    // const tokenRes = await orderService.getTeslaToken();
    // console.log(tokenRes);
    // const BASE_URL = 'https://fleet-api.prd.eu.vn.cloud.tesla.com';
    // const vin = 'LRW3E7FS2PC758945';
    // const token =
    //   'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InE0dHg3Q1UyYzI2V1BiemwxZjZjanM3QnhzayJ9.eyJndHkiOiJjbGllbnQtY3JlZGVudGlhbHMiLCJzdWIiOiJiOGEyNzQzMi03YmMyLTRmZWYtODc0Ni0yMjg3NjgxMTFiYjIiLCJpc3MiOiJodHRwczovL2F1dGgudGVzbGEuY29tL29hdXRoMi92My9udHMiLCJhenAiOiJkM2JhZWFkZDU5OGYtNGIzNC05NzlmLTkyNTJhNjU0N2JkNSIsImF1ZCI6WyJodHRwczovL2F1dGgudGVzbGEuY29tL29hdXRoMi92My9jbGllbnRpbmZvIiwiaHR0cHM6Ly9mbGVldC1hcGkucHJkLmV1LnZuLmNsb3VkLnRlc2xhLmNvbSJdLCJleHAiOjE3MjkwMzg4NzYsImlhdCI6MTcyOTAxMDA3NiwiYWNjb3VudF90eXBlIjoiYnVzaW5lc3MiLCJvcGVuX3NvdXJjZSI6bnVsbCwic2NwIjpbInZlaGljbGVfY21kcyIsInZlaGljbGVfZGV2aWNlX2RhdGEiLCJvcGVuaWQiLCJvZmZsaW5lX2FjY2VzcyJdfQ.qw3d_23bMyF4kGYFuAp0lrBM7_wykRqiOHgQsdLErn0MmYpc25nUp8gXwk1PEZmWgfajHVvMyll5IjzldDAtRwsVbi3waVLWTt6H40o822qWsc_5rU9ak-T5ZHt4H-sYuIW9WHO1pTrMvZ73EAJlFlJ5u8qssBMd7b__MKFEf2OIzDKfSD87m31QuG0m7ZtOuN28nwSWv74I2yQGTAN2O2QVwf2utOe-vo0YbgTPvBjW6ujRVSZeLZFYBGKO9bVarFVE7Q416XqU57TMb3foi-Js9PmXY41Azl9kGcPbmVAiA31hFxk7Iw0Lw76Ck2mas9HY05Dkut-Z_bNUtOVrqQ';

    // try {
    //   const res = await axios.get(`${BASE_URL}/api/1/vehicles`, {
    //     headers: { Authorization: `Bearer ${token}` },
    //   });
    //   console.log(res.data);
    // } catch (error) {
    //   console.log(error.response);
    // }
  }
}

export default App;
