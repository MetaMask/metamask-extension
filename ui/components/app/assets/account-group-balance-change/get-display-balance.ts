import { TextColor } from '../../../../helpers/constants/design-system';

export const isValidAmount = (value: unknown): value is number =>
  typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value);

export const determineBalanceColor = (
  changeValue: number | undefined,
  privacyMode: boolean,
): TextColor => {
  if (privacyMode) {
    return TextColor.textAlternative;
  }

  const val = changeValue ?? 0;
  if (val > 0) {
    return TextColor.successDefault;
  }
  if (val < 0) {
    return TextColor.errorDefault;
  }
  return TextColor.textDefault;
};

export const formatPercentageChange = (
  percentChange: number | undefined,
  locale: string,
): string => {
  const percentNumber = typeof percentChange === 'number' ? percentChange : 0;

  // Clamp absolute value to minimum 0.01, preserve sign
  const displayPercent =
    percentNumber === 0
      ? 0
      : Math.sign(percentNumber) * Math.max(Math.abs(percentNumber), 0.01);

  const localizedPercent = Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    signDisplay: 'always', // sets '+' for positive, '-' for negative
  }).format(displayPercent / 100);

  return `(${localizedPercent})`;
};
