import { config as configDotenv } from 'dotenv';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
// import './instrument';
import server from './server';
import { printAppInfo } from './utils/print-app-info';
import appConfig from './config/app.config';
import cronJobs from './utils/cron-jobs';
import prismaClient from '@/lib/prisma';
import environment from '@/lib/environment';

Sentry.init({
  dsn: environment.sentryDsn,
  integrations: [
    // Add our Profiling integration
    nodeProfilingIntegration(),
  ],

  // Add Tracing by setting tracesSampleRate
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // Set sampling rate for profiling
  // This is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});

configDotenv();
cronJobs();

server.listen(process.env.PORT || 8080, () => {
  const { port, env, appUrl: _appUrl } = environment;
  const {
    api: { basePath, version },
  } = appConfig;
  const appUrl = `${_appUrl}:${port}`;
  const apiUrl = `${appUrl}/${basePath}/${version}/${env}`;
  printAppInfo(port, env, appUrl, apiUrl);
});

process.on('SIGINT', () => {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  prismaClient.$disconnect();
  console.log('Prisma Disconnected.');
  process.exit(0);
});
