export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();
