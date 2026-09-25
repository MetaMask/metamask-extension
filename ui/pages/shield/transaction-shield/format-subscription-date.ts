// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import { getShortDateFormatterV2 } from '../../asset/util';

export function formatSubscriptionDate(date?: string): string | undefined {
  return date ? getShortDateFormatterV2().format(new Date(date)) : undefined;
}

export function formatSubscriptionPeriod(
  start?: string,
  end?: string,
): string | undefined {
  const formattedStart = formatSubscriptionDate(start);
  const formattedEnd = formatSubscriptionDate(end);
  return formattedStart && formattedEnd
    ? `${formattedStart} - ${formattedEnd}`
    : undefined;
}
