import { CandlePeriod, CANDLE_PERIODS } from '../constants/chartConfig';

export const isMatchingPeriod = (
  periodA: CandlePeriod | string | undefined,
  periodB: CandlePeriod | string | undefined,
) => periodA === periodB;

export const getCandlePeriodLabel = (period: CandlePeriod | string): string => {
  const candlePeriod = CANDLE_PERIODS.find((candidate) =>
    isMatchingPeriod(candidate.value, period),
  );

  return candlePeriod?.label || period;
};
