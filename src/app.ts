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
// import fetch from 'node-fetch';

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
    //   'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InE0dHg3Q1UyYzI2V1BiemwxZjZjanM3QnhzayJ9.eyJpc3MiOiJodHRwczovL2F1dGgudGVzbGEuY29tL29hdXRoMi92My9udHMiLCJhenAiOiJkM2JhZWFkZDU5OGYtNGIzNC05NzlmLTkyNTJhNjU0N2JkNSIsInN1YiI6IjUwZDQxZWI2LTViOTAtNDFlYi04MDkxLTEyYTZiMjc3MjRiMSIsImF1ZCI6WyJodHRwczovL2ZsZWV0LWFwaS5wcmQubmEudm4uY2xvdWQudGVzbGEuY29tIiwiaHR0cHM6Ly9mbGVldC1hcGkucHJkLmV1LnZuLmNsb3VkLnRlc2xhLmNvbSIsImh0dHBzOi8vYXV0aC50ZXNsYS5jb20vb2F1dGgyL3YzL3VzZXJpbmZvIl0sInNjcCI6WyJvcGVuaWQiLCJ2ZWhpY2xlX2NtZHMiLCJvZmZsaW5lX2FjY2VzcyJdLCJhbXIiOlsicHdkIiwibWZhIiwib3RwIl0sImV4cCI6MTcyOTEwMjkxNiwiaWF0IjoxNzI5MDc0MTE2LCJvdV9jb2RlIjoiRVUiLCJsb2NhbGUiOiJubC1OTCIsImFjY291bnRfdHlwZSI6ImJ1c2luZXNzIiwib3Blbl9zb3VyY2UiOm51bGwsImFjY291bnRfaWQiOiJiOGEyNzQzMi03YmMyLTRmZWYtODc0Ni0yMjg3NjgxMTFiYjIiLCJhdXRoX3RpbWUiOjE3MjkwNzQxMTV9.AdWiY-UydhoP25oRnko-uYiTH-uRQ0WSVRPac80kziISwi39zKM-HffyfksSKsVBoANroJfCZkqquUkTlgfPLgzB6-fqsHCo5Vm39Wo5jYZ8Tz2NdpB3IjqLsAbo1FI0n0QZT7jOp8Ek_Fk1zwDq08o8a1K55AgkSHzukGv9tkTgqcs-oR1kEZ13tjZ2v8galngG8xkSzH3HSRrGhL4mgRmejl7svbJmbjfuSOxjm76l2UYlVnrkylZ6CoVfzP6TeOBEa9EosevCVjJe2H8rN_XV8JbCPPRe7mbIqlddXwMBBGVlhVXGjFC9GCv4qzUcisuAoc5yo1nkztIGe3aatQ';

    // try {
    //   const res = await fetch(`${BASE_URL}/api/1/vehicles/${vin}/wake_up`, {
    //     method: 'POST',
    //     headers: { Authorization: `Bearer ${token}` },
    //   });
    //   const data = await res.json();
    //   console.log(data, res.status);
    // } catch (error) {
    //   console.log(error, error.status);
    // }
  }
}

export default App;
