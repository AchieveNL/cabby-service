import axios from 'axios';

export async function urlToBase64(url: string) {
  const file = await axios.get(url, { responseType: 'arraybuffer' });
  const raw = Buffer.from(file.data).toString('base64');
  return raw;
}
