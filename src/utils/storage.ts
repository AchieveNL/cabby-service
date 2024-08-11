import { Storage } from '@google-cloud/storage';

const bucketName =
  process.env.NODE_ENV === 'production' ? 'cabby-bucket-prod' : 'cabby-bucket';

const gStorage =
  process.env.NODE_ENV === 'development'
    ? new Storage({
        credentials: JSON.parse(process.env.GC_CREDENTIALS_JSON as string),
        projectId: 'cabby-392012',
      })
    : new Storage();

export { gStorage, bucketName };
