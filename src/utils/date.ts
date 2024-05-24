import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import duration from 'dayjs/plugin/duration.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(timezone);
dayjs.extend(duration);
dayjs.extend(utc);

export default dayjs;

export const netherlandsTimeNow = dayjs().utc().add(2, 'h');
