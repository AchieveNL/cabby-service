import * as mollieClient from '@mollie/api-client';

export const mollie = mollieClient.createMollieClient({
  apiKey: process.env.MOLLIE_API_KEY as string,
});
