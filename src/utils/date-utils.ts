import dayjs from 'dayjs';

const formatDateWithoutTimezone = (date: Date): string => {
  return dayjs(date).format('YYYY-MM-DDTHH:mm:ss.SSS');
};

export const removeTimezoneFromDates = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string' && !isNaN(Date.parse(obj))) {
    // Check if the string is a valid date and format it
    return formatDateWithoutTimezone(new Date(obj));
  } else if (typeof obj === 'object' && !Array.isArray(obj)) {
    // If it's an object, recursively apply the function to each property
    for (const key in obj) {
      // eslint-disable-next-line no-prototype-builtins
      if (obj.hasOwnProperty(key)) {
        obj[key] = removeTimezoneFromDates(obj[key]);
      }
    }
  } else if (Array.isArray(obj)) {
    // If it's an array, recursively apply the function to each item
    for (let i = 0; i < obj.length; i++) {
      obj[i] = removeTimezoneFromDates(obj[i]);
    }
  }

  return obj;
};
