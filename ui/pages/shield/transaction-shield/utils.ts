// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import { getShortDateFormatterV2 } from '../../asset/util';

/**
 * Formats an optional ISO date string for display. `currentPeriodStart` and
 * `currentPeriodEnd` are optional on subscriptions (subscription-controller
 * >= 10), and formatting an undefined date throws a RangeError.
 *
 * @param dateString - The ISO date string, if present.
 * @returns The formatted date, or an em dash when absent.
 */
export function formatOptionalDate(dateString?: string): string {
  return dateString
    ? getShortDateFormatterV2().format(new Date(dateString))
    : '—';
}
