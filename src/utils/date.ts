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
