import moment from 'moment-timezone';

const DEFAULT_TIMEZONE = 'Europe/Amsterdam';
const DEFAULT_LOCALE = 'nl-NL';
moment.tz.setDefault(DEFAULT_TIMEZONE);
moment.locale(DEFAULT_LOCALE);

const OriginalDate = Date;

class CustomDate extends OriginalDate {
  constructor(...args: any[]) {
    if (args.length === 0) {
      super(moment().tz(DEFAULT_TIMEZONE).format());
    } else if (args.length === 1 && typeof args[0] === 'string') {
      super(moment.tz(args[0], DEFAULT_TIMEZONE).format());
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment, @typescript-eslint/prefer-ts-expect-error
      // @ts-ignore
      super(...args);
    }
  }

  toLocaleDateString(
    locale: string = DEFAULT_LOCALE,
    options: Intl.DateTimeFormatOptions = {}
  ): string {
    return moment(this).tz(DEFAULT_TIMEZONE).locale(locale).format('L');
  }

  toLocaleString(
    locale: string = DEFAULT_LOCALE,
    options: Intl.DateTimeFormatOptions = {}
  ): string {
    return moment(this).tz(DEFAULT_TIMEZONE).locale(locale).format('L LT');
  }

  toLocaleTimeString(
    locale: string = DEFAULT_LOCALE,
    options: Intl.DateTimeFormatOptions = {}
  ): string {
    return moment(this).tz(DEFAULT_TIMEZONE).locale(locale).format('LT');
  }
}

(global as any).Date = CustomDate;

export const getCurrentDate = (): string => moment().format();
export const formatDate = (
  date: Date,
  format: string = 'YYYY-MM-DD HH:mm:ss'
): string => moment(date).format(format);
export const parseDate = (
  dateString: string,
  format: string = 'YYYY-MM-DD HH:mm:ss'
): Date => new Date(moment.tz(dateString, format, DEFAULT_TIMEZONE).format());
