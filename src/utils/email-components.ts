import { readFile } from 'fs/promises';
import path, { dirname } from 'path';

export const emailActionButton = (text: string, url: string) => {
  return `
  <td class="t16" style="
  background-color: #022fab;
  overflow: hidden;
  width: 326px;
  text-align: center;
  line-height: 50px;
  mso-line-height-rule: exactly;
  mso-text-raise: 10px;
  border-radius: 14px
    14px
    14px
    14px;
">
  <a class="t14" href="${url}" style="
  display: block;
  margin: 0;
  margin: 0;
  font-family: Inter,
    BlinkMacSystemFont,
    Segoe
      UI,
    Helvetica
      Neue,
    Arial,
    sans-serif;
  line-height: 50px;
  font-weight: 600;
  font-style: normal;
  font-size: 18px;
  text-decoration: none;
  direction: ltr;
  color: #ffffff;
  text-align: center;
  mso-line-height-rule: exactly;
  mso-text-raise: 10px;
" target="_blank">${text}
password</a></td>`;
};

export const generateEmailTemplate = async ({
  subject = '',
  text = '',
}: {
  subject?: string;
  text?: string;
  // email: string;
  // html: string;
}) => {
  const appDir = dirname(require?.main?.filename as string);
  const templatePath = path.join(
    appDir,
    '../public/templates/email_template.html'
  );

  try {
    const data = await readFile(templatePath, 'utf8');

    // Typecast data to string
    const template = data as unknown as string;

    // Replace placeholders in the HTML template
    const replacedHtml = template
      .replace('{{title}}', subject)
      .replace('{{content}}', text)
      .replace('{{subcontent}}', '')
      .replace('{{action}}', '');

    return replacedHtml;
  } catch (err) {
    console.error('Error reading file:', err);
    throw err; // Propagate the error
  }
};
