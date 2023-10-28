import { mailSender } from '@/config/mailer.config';
import { mailService } from '@/utils/mail';
import { log } from 'console';

export default class MailService {
  async OptMailSender(email, otp) {
    const otpMessage = {
      to: email,
      from: 'info@cabbyrentals.com',
      subject: 'Your OTP for Cabby Rentals',
      text: `Your OTP for Cabby Rentals is: ${otp}. It will expire in 15 minutes.`,
      html: `
              <strong>Your OTP for Cabby Rentals is:</strong> 
              <h2>${otp}</h2>
              <p>This OTP will expire in 15 minutes.</p>
            `,
    };
    console.log('OTP email sent successfully.', otp);
    console.log('otp message', otpMessage);

    await mailSender(otpMessage);
  }
}
