import { type MailDataRequired } from '@sendgrid/mail';
import { mailSender } from '@/config/mailer.config';

type Options = Omit<MailDataRequired, 'from'>;

const generateEmail = (data: Options) => data;

export default class OrderMailService {
  async orderConfirmedMailSender(email: string, papers: string[]) {
    // const papersBase64 = await papers.map((paper) =>
    //   fetch(paper)
    //     .then((r) => r.buffer())
    //     .then((buf) => `data:image/png;base64,` + buf.toString('base64'))
    // );

    const mailMessage = generateEmail({
      to: email,
      subject: 'Your order is confirmed',
      text: `Your order is confirmed`,
      html: `
        <h2>Your order is confirmed</h2>
        ${papers.map((paper) => `<img src=${paper} alt=${paper}/>`).join(' ')}
      `,
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
