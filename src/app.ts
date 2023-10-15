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
import errorHandler from '@/middlewares/error-handler';
import routes from '@/modules/index';
import prismaClient from '@/lib/prisma';

const determineCorsOrigin = () => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return 'https://cabby-admin-production-jtj2mdm6ta-ez.a.run.app';
    case 'staging':
      return 'https://cabby-admin-staging-jtj2mdm6ta-ez.a.run.app';
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
    this.express.use(
      cors({
        origin: determineCorsOrigin(),
        credentials: true,
      })
    );
  }

  private disableSettings(): void {
    this.express.disable('x-powered-by');
  }

  private setRoutes(): void {
    const {
      api: { version },
    } = appConfig;
    const { env } = environment;
    this.express.use('/', home);
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
