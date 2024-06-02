import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import duration from 'dayjs/plugin/duration.js';
import timezone from 'dayjs/plugin/timezone.js';
import localizedFormat from 'dayjs/plugin/localizedFormat.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);
dayjs.extend(timezone);
dayjs.extend(duration);
dayjs.extend(utc);

const tz = 'Europe/Amsterdam';
dayjs.tz.setDefault(tz);

export const dayjsExtended = dayjs;

export default dayjsExtended;

const netherlandsOffset = dayjs().tz(tz).utcOffset();
export const utcOffset = dayjs().utcOffset();

export const netherlandsTimeNow = () =>
  dayjs().utc().add(netherlandsOffset, 'm').toDate();

export const formatDateWithoutTimezone = (date) => {
  return dayjs(date).format('YYYY-MM-DDTHH:mm:ss.SSS');
};
