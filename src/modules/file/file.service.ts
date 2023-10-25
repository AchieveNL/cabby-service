import { Readable } from 'stream';
import PDFDocument from 'pdfkit';
import getStream from 'get-stream';
import { bucketName, gStorage } from '@/utils/storage';
import prisma from '@/lib/prisma';

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

  public async generateAndSaveInvoice(
    orderId: string,
    userId: string,
    paymentId: string
  ): Promise<string> {
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        payment: true,
      },
    });

    if (!order?.user) {
      throw new Error('User not found.');
    }

    const user = order.user;

    const doc = new PDFDocument();

    doc.fontSize(20).text('Invoice', { align: 'center' }).moveDown();

    doc
      .fontSize(14)
      .text('User Information:')
      .moveDown(0.5)
      .fontSize(12)
      .text(`Name: ${String(user.profile?.fullName ?? '')}`)
      .text(`Email: ${String(user.email ?? '')}`)
      .text(`Phone Number: ${String(user.profile?.phoneNumber ?? '')}`)
      .moveDown();

    doc
      .fontSize(14)
      .text('Order Details:')
      .moveDown(0.5)
      .fontSize(12)
      .text(`Order ID: ${String(order?.id ?? '')}`)
      .text(`Order Date: ${String(order?.createdAt ?? '')}`)
      .text(
        `Total Amount: ${String(order?.totalAmount ?? '')} ${String('EUR')}`
      )
      .moveDown();

    doc.end();
    const pdfBuffer = await getStream.buffer(doc);

    const mimeType = 'application/pdf';
    const fileName = `invoice-${String(order.id)}.pdf`;
    const fileType = 'PDF';

    const invoiceUrl = await this.uploadFile(
      pdfBuffer,
      fileName,
      mimeType,
      fileType
    );
    return invoiceUrl;
  }
}

export default FileService;
