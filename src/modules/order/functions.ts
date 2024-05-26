import dayjs from '@/utils/date';

const timeframes = [
  [0, 6],
  [6, 12],
  [12, 18],
  [18, 24],
];

const milliInHours = 60 * 60 * 1000;

const values = [
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
];

function durationInMilli(start: Date, end: Date) {
  return dayjs(end).diff(start) / milliInHours;
}

function calculateTimeframes(startDate: Date, endDate: Date) {
  let start = startDate;
  const end = endDate;

  while (start <= end) {
    const day = dayjs.utc(start).get('day');
    const row = day - 1;
    // console.log("Row", row);
    const trueRow = row >= 0 ? row : 6;
    // console.log("truerow", trueRow);

    for (const [column, timeframe] of timeframes.entries()) {
      // console.log("Column", column);
      const one = timeframe[0];
      const two = timeframe[1];
      const timeframeStart = dayjs.utc(start).set('hours', one).toDate();
      const timeframeEnd = dayjs.utc(start).set('hours', two).toDate();

      let value = 0;
      if (!(endDate <= timeframeStart || startDate >= timeframeEnd)) {
        if (timeframeStart >= startDate && timeframeEnd <= endDate) {
          // console.log("1");
          value = 6;
        } else if (timeframeStart <= startDate && endDate <= timeframeEnd) {
          // console.log("2");
          value = durationInMilli(startDate, endDate);
        } else if (timeframeEnd >= endDate) {
          // console.log("3");
          value = durationInMilli(timeframeStart, endDate);
        } else if (timeframeStart <= startDate) {
          // console.log("4");
          value = durationInMilli(start, timeframeEnd);
        }

        values[trueRow][column] += value;
      }
    }

    start = dayjs.utc(start).add(1, 'day').toDate();
  }

  return values;
}

export function calculateOrderPrice(
  startDate: Date,
  endDate: Date,
  pricing: number[][]
) {
  startDate = new Date(startDate);
  endDate = new Date(endDate);
  console.log({ startDate, endDate, pricing });
  const timeframes = calculateTimeframes(startDate, endDate);
  console.log(timeframes);

  let price = 0;

  pricing.forEach((row, rowIndex) => {
    row.forEach((col, colIndex) => {
      price += col * timeframes[rowIndex][colIndex];
    });
  });

  return price;
}
