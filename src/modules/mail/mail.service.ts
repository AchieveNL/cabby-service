import { mailSender } from '@/config/mailer.config';

const generateEmail = (
  email: string,
  subject: string,
  text: string,
  html: string
) => {
  return {
    to: email,
    from: 'info@cabbyrentals.com',
    subject,
    text,
    html,
  };
};

export default class MailService {
  async optMailSender(email, otp) {
    const mailMessage = generateEmail(email, 'gshjgej', "jdhrhhfh", "JEHDFGVHD");
 
    console.log('OTP email sent successfully.', otp);
    console.log('otp message', mailMessage);
  
    await mailSender(mailMessage);
  }
}  
