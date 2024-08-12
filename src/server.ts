// import * as Sentry from '@sentry/node';
import App from './app';

const app = new App();
// Sentry.setupExpressErrorHandler(app);
const server = app.express;

app.connectPrisma().catch((e) => {
  throw e;
});

export default server;
