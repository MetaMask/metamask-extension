import {
  NotificationCategoryId,
  type NotificationCategoryMetadata,
} from './notification-categories-types';

const CATEGORIES_BY_LOCALE: Record<string, NotificationCategoryMetadata[]> = {
  en: [
    {
      id: NotificationCategoryId.WalletActivity,
      label: 'Wallet activity',
      description: 'Buys, sells, transfers, and swaps',
      icon: 'Clock',
    },
    {
      id: NotificationCategoryId.Perps,
      label: 'Trading activity',
      description:
        'Perps position changes, liquidations, funding rates, and margin updates',
      icon: 'Candlestick',
    },
    {
      id: NotificationCategoryId.SocialAI,
      label: 'Trading signals',
      description:
        'Updates from traders and assets you follow, plus curated market news',
      icon: 'Flash',
    },
    {
      id: NotificationCategoryId.Marketing,
      label: 'Updates and rewards',
      description:
        'Product updates, feature announcements, and new rewards campaigns',
      icon: 'Campaign',
    },
    {
      id: NotificationCategoryId.AgenticCli,
      label: 'Agentic CLI',
      description:
        'CLI connection requests, approvals, and session updates for Agentic',
      icon: 'Code',
    },
  ],
};

/**
 * Mocks `GET /api/v1/notifications/categories?locale=<locale>` until the
 * Notifications API exposes this endpoint for real. Labels/descriptions are
 * expected to be localized server-side, so this fakes that by keying off the
 * base language of the given locale.
 *
 * @param locale - The user's current locale, e.g. `en-US`.
 * @returns The notification category catalog for that locale.
 */
export async function fetchNotificationCategories(
  locale: string,
): Promise<NotificationCategoryMetadata[]> {
  const language = locale.toLowerCase().split(/[-_]/u)[0];
  return CATEGORIES_BY_LOCALE[language] ?? CATEGORIES_BY_LOCALE.en;
}
