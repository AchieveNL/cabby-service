import sgMail from '@sendgrid/mail';

export const mailSender = async (otpMessage) => {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);
    console.log('Sending email:', otpMessage);
    // Determine the recipient based on the environment
    let recipient = otpMessage.to;
    if (process.env.NODE_ENV === 'development') {
      recipient = process.env.TEST_EMAIL ?? 'no-reply@cabbyrentals.nl'; // Override recipient for non-production environments
    }

    const message = {
      ...otpMessage,
      to: recipient, // Use the determined recipient
      from: 'no-reply@cabbyrentals.nl', // Your verified SendGrid sender
    };

    console.log('Sending email to: ', recipient);
    const response = await sgMail.send(message);
    console.log('Email sent:', response);
    return response;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error; // Rethrow the error for handling elsewhere if needed
  }
};
