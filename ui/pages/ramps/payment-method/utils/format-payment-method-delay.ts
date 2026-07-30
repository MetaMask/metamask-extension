import type { useI18nContext } from '../../../../hooks/useI18nContext';

/**
 * Converts a payment-method delay range (minutes) into description tokens.
 *
 * Ported from MetaMask mobile `timeToDescription` in Ramp Aggregator utils.
 *
 * @param timeArr - `[lower, upper]` delay bounds in minutes.
 * @returns Ordered tokens for i18n rendering.
 */
export type DelayDescriptionToken =
  | string
  | 'instant'
  | 'less_than'
  | 'separator'
  | 'minutes'
  | 'minute'
  | 'hours'
  | 'hour'
  | 'business_days'
  | 'business_day';

export function timeToDescription(timeArr: number[]): DelayDescriptionToken[] {
  const [lower, upper] = timeArr;
  const isOverADay = (minutes: number) => minutes >= 60 * 24;
  const isOverAnHour = (minutes: number) => minutes >= 60;
  const toDay = (minutes: number) => Math.round(minutes / (60 * 24));
  const toHour = (minutes: number) => Math.round(minutes / 60);

  if (lower === 0 && upper === 0) {
    return ['instant'];
  }

  if (lower === 0) {
    if (isOverADay(upper)) {
      return toDay(upper) === 1
        ? ['less_than', toDay(upper).toString(), 'business_day']
        : ['less_than', toDay(upper).toString(), 'business_days'];
    }

    if (isOverAnHour(upper)) {
      return toHour(upper) === 1
        ? ['less_than', toHour(upper).toString(), 'hour']
        : ['less_than', toHour(upper).toString(), 'hours'];
    }

    return upper === 1
      ? ['less_than', upper.toString(), 'minute']
      : ['less_than', upper.toString(), 'minutes'];
  }

  if (isOverADay(lower)) {
    return [
      toDay(lower).toString(),
      'separator',
      toDay(upper).toString(),
      'business_days',
    ];
  }

  if (isOverAnHour(lower)) {
    return [
      toHour(lower).toString(),
      'separator',
      toHour(upper).toString(),
      'hours',
    ];
  }

  return [lower.toString(), 'separator', upper.toString(), 'minutes'];
}

type TranslateFn = ReturnType<typeof useI18nContext>;

function translateDelayToken(
  token: DelayDescriptionToken,
  t: TranslateFn,
): string {
  switch (token) {
    case 'instant':
      return t('rampsPaymentDelayInstant');
    case 'less_than':
      return t('rampsPaymentDelayLessThan');
    case 'separator':
      return '-';
    case 'minutes':
      return t('rampsPaymentDelayMinutes');
    case 'minute':
      return t('rampsPaymentDelayMinute');
    case 'hours':
      return t('rampsPaymentDelayHours');
    case 'hour':
      return t('rampsPaymentDelayHour');
    case 'business_days':
      return t('rampsPaymentDelayBusinessDays');
    case 'business_day':
      return t('rampsPaymentDelayBusinessDay');
    default:
      return token;
  }
}

/**
 * Formats a payment method delay array for display (e.g. "5 - 10 mins").
 *
 * @param delay - Delay bounds in minutes, when present.
 * @param t - i18n translate function.
 * @returns Localized delay label, or null when unavailable.
 */
export function formatPaymentMethodDelay(
  delay: number[] | undefined,
  t: TranslateFn,
): string | null {
  if (!Array.isArray(delay) || delay.length < 2) {
    return null;
  }

  return timeToDescription(delay)
    .map((token) => translateDelayToken(token, t))
    .join(' ');
}
