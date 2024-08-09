import dayjsExtended, { getUtcOffset } from '@/utils/date';

const timeframes = [
  [0, 6],
  [6, 12],
  [12, 18],
  [18, 24],
];

const milliInHours = 60 * 60 * 1000;

function durationInMilli(start: Date, end: Date) {
  return dayjsExtended(end).diff(start) / milliInHours;
}

export function calculateTimeframes(startDate: Date, endDate: Date) {
  const values = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];

  let start = startDate;
  const end = endDate;
  while (start <= end) {
    // console.log({ start, end, res: start <= end });
    const day = dayjsExtended.utc(start).get('day');
    const row = day - 1;
    const trueRow = row >= 0 ? row : 6;

    for (const [column, timeframe] of timeframes.entries()) {
      const one = timeframe[0];
      const two = timeframe[1];
      const timeframeStart = dayjsExtended
        .utc(start)
        .set('hours', one)
        .set('m', 0)
        .toDate();
      const timeframeEnd = dayjsExtended
        .utc(start)
        .set('hours', two)
        .set('m', 0)
        .toDate();
      let value = 0;
      if (!(endDate <= timeframeStart || startDate >= timeframeEnd)) {
        if (timeframeStart >= startDate && timeframeEnd <= endDate) {
          value = 6;
        } else if (timeframeStart <= startDate && endDate <= timeframeEnd) {
          value = durationInMilli(startDate, endDate);
        } else if (timeframeEnd >= endDate) {
          value = durationInMilli(timeframeStart, endDate);
        } else if (timeframeStart <= startDate) {
          value = durationInMilli(start, timeframeEnd);
        }

        values[trueRow][column] += value;
      }
    }

    start = dayjsExtended
      .utc(start)
      .add(1, 'day')
      .set('h', 0)
      .set('m', 0)
      .toDate();
  }

  return values;
}

export function calculateOrderPrice(
  startDate: Date,
  endDate: Date,
  pricing: number[][]
) {
  startDate = dayjsExtended(startDate).add(getUtcOffset(), 'm').toDate();
  endDate = dayjsExtended(endDate).add(getUtcOffset(), 'm').toDate();
  console.log(startDate, endDate);

  // console.log(startDate, endDate);
  const timeframes = calculateTimeframes(startDate, endDate);
  // console.log({ pricing, timeframes });
  let price = 0;

  pricing.forEach((row, rowIndex) => {
    row.forEach((col, colIndex) => {
      price += col * timeframes[rowIndex][colIndex];
    });
  });

  return price;
}
