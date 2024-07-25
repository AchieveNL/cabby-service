import 'dayjs/locale/nl.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import duration from 'dayjs/plugin/duration.js';
import timezone from 'dayjs/plugin/timezone.js';
import localizedFormat from 'dayjs/plugin/localizedFormat.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';

dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);
dayjs.extend(timezone);
dayjs.extend(duration);
dayjs.extend(utc);

export const tz = 'Europe/Amsterdam';
dayjs.tz.setDefault(tz);
dayjs.locale('nl');

export const dayjsExtended = dayjs;

export default dayjsExtended;

export const getUtcOffset = () => dayjsExtended.tz().utcOffset();

export const formatDateWithoutTimezone = (date) => {
  return dayjs(date).format('YYYY-MM-DDTHH:mm:ss.SSS');
};

export const dateTimeFormat = (date?: Date | string) =>
  dayjs(date).isValid() ? dayjs(date).format('DD/MM/YYYY • HH:mm') : '';

export const dateToString = (date?: Date | string) =>
  dayjs(date).isValid() ? dayjs(date).format('YYYY-MM-DD') : '';

export const formatDuration = (start: Date, end: Date) =>
  dayjs
    .duration(dayjsExtended(end).diff(dayjsExtended(start)))
    .format('D [days] HH:mm');

// Function to get New Year's Eve
export function getNewYearsEve() {
  const year = new Date().getFullYear();
  return new Date(year, 11, 31);
}

// Function to get Christmas
export function getChristmas() {
  const year = new Date().getFullYear();
  return new Date(year, 11, 25);
}

// Function to get King's Day (April 27th or 26th if the 27th is a Sunday)
export function getKingsDay() {
  const year = new Date().getFullYear();
  const date = new Date(year, 3, 27);
  if (date.getDay() === 0) {
    date.setDate(26);
  }
  return date;
}

// Function to calculate Easter Sunday using the Anonymous Gregorian algorithm
export function getEaster() {
  const year = new Date().getFullYear();
  const f = Math.floor;
  const G = year % 19;
  const C = f(year / 100);
  const H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30;
  const I =
    H - f(H / 28) * (1 - f(H / 28) * f(29 / (H + 1)) * f((21 - G) / 11));
  const J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7;
  const L = I - J;
  const month = 3 + f((L + 40) / 44);
  const day = L + 28 - 31 * f(month / 4);
  return new Date(year, month - 1, day);
}

// Function to get Whitsun (Pentecost) which is 49 days after Easter Sunday
export function getWhitsun() {
  const easter = getEaster();
  const whitsun = new Date(easter);
  whitsun.setDate(easter.getDate() + 49);
  return whitsun;
}
