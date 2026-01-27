/**
 * Formats a timestamp into a date and time string.
 *
 * @param timestamp - The timestamp in milliseconds.
 * @param locale - The locale for formatting.
 * @returns Object containing formatted time and date strings.
 */
export function formatTransactionDateTime(
  timestamp: number,
  locale = 'en-US',
): { time: string; date: string } {
  const dateObj = new Date(timestamp);

  const time = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(dateObj);

  const month = new Intl.DateTimeFormat(locale, {
    month: 'short',
  }).format(dateObj);

  const date = `${month} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;

  return { time, date };
}
