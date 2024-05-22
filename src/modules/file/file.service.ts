import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb } from 'pdf-lib';
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

  private readonly readFile = (filePath: string): Buffer =>
    fs.readFileSync(filePath);

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
        vehicle: true,
      },
    });

    if (!order?.user) {
      throw new Error('User not found.');
    }

    const user = order.user;
    const existingPdfBytes = this.readFile(
      path.join(__dirname, '../../../public/assets/cabby_factuur-leeg.pdf')
    );
    const doc = await PDFDocument.load(existingPdfBytes);
    const invoice = doc.getPages()[0];
    const textSize = 12;

    // invoice.drawText('Left Side Text', {
    //   x: 50, // Closer to the left edge
    //   y: 700,
    //   size: 12,
    //   color: rgb(0, 0, 0),
    // });

    const companyAdress = {
      x: 50,
      y: 700,
      lines: ['Cabby', 'Venenweg 66', '1161 AK Zwanenburg'],
    };

    // Adding text to the left side
    companyAdress.lines.forEach((line, index) => {
      invoice.drawText(line, {
        x: companyAdress.x,
        y: companyAdress.y - index * 15,
        size: textSize,
        color: rgb(0, 0, 0),
      });
    });
    // KVK: 85848867
    // BTW: NL863765701B01
    // IBAN: NL43 BUNQ 2074 9321 11
    // BIC: BUNQNL2A
    const companyDetails = {
      x: 400,
      y: 700,
      lines: [
        'KVK: 85848867',
        'BTW: NL863765701B01',
        'IBAN: NL43 BUNQ 2074 9321 11',
        'BIC: BUNQNL2A',
      ],
    };

    companyDetails.lines.forEach((line, index) => {
      invoice.drawText(line, {
        x: companyDetails.x,
        y: companyDetails.y - index * 15,
        size: textSize,
        color: rgb(0, 0, 0),
      });
    });

    // <Maurits Autoverhuur B.V.>
    // <T.a.v. M Nasr>
    // <Venenweg 66>
    // <1161AK Zwanenburg>

    const companyName = order.vehicle.companyName;
    const customerAdress = {
      x: 50,
      y: 620,
      lines: [
        `${companyName ?? 'N/A'}`,
        `${user.profile?.fullAddress ?? 'N/A'}`,
        `${user.profile?.zip ?? 'N/A'} ${user.profile?.city ?? 'N/A'}`,
      ],
    };

    customerAdress.lines.forEach((line, index) => {
      invoice.drawText(line, {
        x: customerAdress.x,
        y: customerAdress.y - index * 15,
        size: textSize,
        color: rgb(0, 0, 0),
      });
    });

    // Factuurdatum: <invoice date>
    // Vervaldatum: <expire date>
    const factuurNumber = await prisma.order.count({
      where: {
        userId: order.userId,
      },
    });

    const invoiceDates = {
      x: 400,
      y: 620,
      lines: [
        `Factuur: CR-00${factuurNumber}`,
        `Factuurdatum: ${new Date().toLocaleDateString()}`,
      ],
    };

    invoiceDates.lines.forEach((line, index) => {
      invoice.drawText(line, {
        x: invoiceDates.x,
        y: invoiceDates.y - index * 15,
        size: textSize,
        color: rgb(0, 0, 0),
      });
    });

    // Factuur: <invoice number>
    // const invoiceNumber = {
    //   x: 50,
    //   y: 600,
    //   lines: [`Factuur: CR-00${factuurNumber}`],
    // };

    // invoiceNumber.lines.forEach((line, index) => {
    //   invoice.drawText(line, {
    //     x: invoiceNumber.x,
    //     y: invoiceNumber.y - index * 15,
    //     size: textSize,
    //     color: rgb(0, 0, 0),
    //   });
    // });
    // Car names example: Toyota Auris 8-SPK-31>
    // const carNames = {
    //   x: 50,
    //   y: 580,
    //   lines: [
    //     `${order.vehicle?.companyName ?? 'N/A'} ${
    //       order.vehicle?.model ?? 'N/A'
    //     } ${order.vehicle?.licensePlate ?? 'N/A'}`,
    //   ],
    // };

    // carNames.lines.forEach((line, index) => {
    //   invoice.drawText(line, {
    //     x: carNames.x,
    //     y: carNames.y - index * 15,
    //     size: textSize,
    //     color: rgb(0, 0, 0),
    //   });
    // });

    const drawLine = (page, start, end) => {
      page.drawLine({
        start: { x: start.x, y: start.y },
        end: { x: end.x, y: end.y },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
    };

    const startYTable = 550;
    const rowHeight = 20;

    const drawTableHeader = () => {
      const headers = [
        'Aantal',
        'Beschrijving',
        'Bedrag incl. btw',
        // 'Bedrag excl. btw',
      ];
      const xPositions = [50, 100, 350, 450]; // Example positions, adjust as needed
      headers.forEach((text, index) => {
        invoice.drawText(text, {
          x: xPositions[index],
          y: startYTable,
          size: textSize,
          color: rgb(0, 0, 0),
        });
      });
      // Draw the header underline
      drawLine(
        invoice,
        { x: 50, y: startYTable - 15 },
        { x: 570, y: startYTable - 15 }
      );
    };

    const VAT_RATE = 0.21; // 21%

    const totalAmount = order.totalAmount;
    const exclPrice = totalAmount.toFixed(2);
    const inclPrice = (Number(totalAmount) * (1 + VAT_RATE)).toFixed(2);
    const vat = (
      Number(totalAmount) -
      Number(totalAmount) / (1 + VAT_RATE)
    ).toFixed(2);

    const items = [
      {
        quantity: 1,
        description: `${
          [order.vehicle?.model, order.vehicle.licensePlate].join(' ') ?? ''
        }`,
        price: order.totalAmount.toFixed(2),
        priceExclVat: exclPrice,
        // priceExclVat: (Number(order.totalAmount) / (1 + VAT_RATE)).toFixed(2),
        // priceInclVat: Number(order.totalAmount).toFixed(2),
      },
    ];

    const totals = {
      exclVat: exclPrice,
      vat,
      inclVat: inclPrice,
    };

    const drawItems = () => {
      items.forEach((item, index) => {
        const yPosition = startYTable - (index + 1.5) * rowHeight;
        invoice.drawText(item.quantity.toString(), {
          x: 50,
          y: yPosition,
          size: textSize,
        });
        invoice.drawText(item.description, {
          x: 100,
          y: yPosition,
          size: textSize,
        });
        invoice.drawText(`€ ${item.priceExclVat}`, {
          x: 350,
          y: yPosition,
          size: textSize,
        });
        // invoice.drawText(`€ ${item.priceInclVat}`, {
        //   x: 450,
        //   y: yPosition,
        //   size: textSize,
        // });
      });
      // Draw the line after items
      drawLine(
        invoice,
        { x: 50, y: startYTable - (items.length + 1) * rowHeight - 5 },
        { x: 570, y: startYTable - (items.length + 1) * rowHeight - 5 }
      );
    };

    const drawTotals = () => {
      const baseY = startYTable - (items.length + 2) * rowHeight;
      // Assuming `totals` is an object with your calculated totals
      invoice.drawText(`Totaalbedrag excl. btw`, {
        x: 200,
        y: baseY,
        size: textSize,
      });
      invoice.drawText(`€ ${totals.exclVat}`, {
        x: 350,
        y: baseY,
        size: textSize,
      });
      invoice.drawText(`21.0% btw van € ${totals.exclVat}`, {
        x: 200,
        y: baseY - rowHeight,
        size: textSize,
      });
      invoice.drawText(`€ ${totals.vat}`, {
        x: 350,
        y: baseY - rowHeight,
        size: textSize,
      });
      drawLine(
        invoice,
        { x: 50, y: baseY - rowHeight - 5 },
        { x: 570, y: baseY - rowHeight - 5 }
      );
      invoice.drawText(`Totaalbedrag incl. btw`, {
        x: 200,
        y: baseY - 2 * rowHeight,
        size: textSize,
      });
      invoice.drawText(`€ ${totals.inclVat}`, {
        x: 350,
        y: baseY - 2 * rowHeight,
        size: textSize,
      });
    };

    drawTableHeader();
    drawItems();
    drawTotals();

    const invoiceEnds = {
      x: 50,
      y: 350,
      lines: [
        'Factuur voldaan onder de voorwaarden van de opgestelde huurovereenkomst.',
        'Factuur is reeds betaald.',
      ],
    };

    invoiceEnds.lines.forEach((line, index) => {
      invoice.drawText(line, {
        x: invoiceEnds.x,
        y: invoiceEnds.y - index * 50,
        size: textSize,
        color: rgb(0, 0, 0),
      });
    });

    const pdfBytes = await doc.save();
    const pdfBuffer = Buffer.from(pdfBytes);
    const fileName = `invoice-${String(order.id)}.pdf`;
    const mimeType = 'application/pdf';

    // return fs.promises.writeFile(fileName, pdfBuffer);

    const invoiceUrl = await this.uploadFile(
      pdfBuffer,
      fileName,
      mimeType,
      'PDF'
    );
    return invoiceUrl;
  }
}

export default FileService;
