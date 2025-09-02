import { type BalanceChangePeriod } from '@metamask/assets-controllers';
import { TextColor } from '../../../../helpers/constants/design-system';

export const isValidAmount = (value: unknown): value is number =>
  typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value);

export const determineBalanceColor = (
  changeValue: number = 0,
  privacyMode: boolean,
): TextColor => {
  if (privacyMode) {
    return TextColor.textAlternative;
  }
  if (changeValue > 0) return TextColor.successDefault;
  if (changeValue < 0) return TextColor.errorDefault;
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

export const formatAmountChange = (
  amountChange: number | undefined,
  fiatCurrency: string,
  locale: string,
): string => {
  if (!isValidAmount(amountChange)) {
    return '';
  }

  try {
    return `${Intl.NumberFormat(locale, {
      style: 'currency',
      currency: fiatCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      signDisplay: 'always', // sets '+' for positive, '-' for negative
    }).format(amountChange)}`;
  } catch {
    // Fallback to decimal formatting if currency formatting fails
    return `${Intl.NumberFormat(locale, {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      signDisplay: 'always', // sets '+' for positive, '-' for negative
    }).format(amountChange)}`;
  }
};
