import { Readable } from 'stream';
import { bucketName, gStorage } from '@/utils/storage';

export class FileService {
  private readonly storage = gStorage;
  private readonly bucket = this.storage.bucket(bucketName);

  public async uploadFile(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    fileType: 'IMAGE' | 'PDF' | 'VIDEO'
  ): Promise<string> {
    const folder = this.getFolderByFileType(fileType);
    const newFileName = `${fileType.toLowerCase()}-${Date.now()}.${
      fileName.split('.').pop() as string
    }`;
    const filePath = `${folder}/${newFileName}`;

    const file = this.bucket.file(filePath);
    const stream = file.createWriteStream({
      resumable: false,
      contentType: mimeType,
    });

    return await new Promise((resolve, reject) =>
      new Readable({
        read() {
          this.push(buffer);
          this.push(null);
        },
      })
        .pipe(stream)
        .on('finish', () => {
          const fullFileUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;
          resolve(fullFileUrl);
        })
        .on('error', reject)
    );
  }

  public async deleteFile(filePath: string): Promise<void> {
    const file = this.bucket.file(filePath);
    await file.delete().catch((err) => {
      console.log('Error Deleting: ', err);
    });
    console.log(`Attempted to delete ${filePath}`);
  }

  private getFolderByFileType(fileType: 'IMAGE' | 'PDF' | 'VIDEO'): string {
    switch (fileType) {
      case 'IMAGE':
        return 'images';
      case 'PDF':
        return 'pdfs';
      case 'VIDEO':
        return 'videos';
      default:
        throw new Error('Invalid file type');
    }
  }
}

export default FileService;
