import { type MailDataRequired } from '@sendgrid/mail';
import { mailSender } from '@/config/mailer.config';
import { generateEmailTemplate } from '@/utils/email-components';

type Options = Omit<MailDataRequired, 'from'>;

const generateEmail = (data: Options) => data;

export default class OrderMailService {
  async orderConfirmedMailSender(email: string, papers: string[]) {
    // const papersBase64 = await papers.map((paper) =>
    //   fetch(paper)
    //     .then((r) => r.buffer())
    //     .then((buf) => `data:image/png;base64,` + buf.toString('base64'))
    // );

    const html = await generateEmailTemplate({
      subject: 'Your order is confirmed',
      text: 'Your order is confirmed',
    });

    const mailMessage = generateEmail({
      to: email,
      subject: 'Your order is confirmed',
      html,
      // attachments: papers.map((paper, index) => {
      //   const paperArray = paper.split('/');
      //   const filename = paperArray[paperArray.length - 1];
      //   return {
      //     content: papersBase64[index],
      //     filename,
      //   };
      // }),
    });
    console.log('Order confirmation email sent successfully.', papers);

    await mailSender(mailMessage);
  }
}
