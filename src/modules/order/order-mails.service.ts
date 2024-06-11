import { type MailDataRequired } from '@sendgrid/mail';
import { mailSender } from '@/config/mailer.config';
import { generateEmailTemplate } from '@/utils/email-components';
import { urlToBase64 } from '@/utils/file';

type Options = Omit<MailDataRequired, 'from'>;

const generateEmail = (data: Options) => data;

export default class OrderMailService {
  async orderConfirmedMailSender(
    email: string,
    name: string = '',
    papers: string[]
  ) {
    const attachments = await Promise.all(
      papers.map(async (paper, index) => {
        const raw = await urlToBase64(paper);
        const words = paper.split('/');
        const filename = words[words.length - 1];

        return {
          content: raw,
          filename,
          // type: 'application/pdf',
          disposition: 'attachment',
        };
      })
    );

    const html = await generateEmailTemplate({
      title: 'Reservering',
      subtitle: 'Bevestigd',
      content: `Beste ${name},<br/><br/>

Geweldig! Je reservering is door ons bevestigd. De autopapieren zijn bijgevoegd in de bijlage.<br/><br/>

We zien je binnenkort. Veel rijplezier!<br/><br/>

Team Cabby`,
    });

    const mailMessage = generateEmail({
      to: email,
      subject: 'Reservering bevestigd',
      html,
      attachments,
    });
    console.log('Order confirmation email sent successfully.', papers);

    await mailSender(mailMessage);
  }
}
