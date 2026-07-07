export enum NotificationCategoryId {
  All = 'all',
  WalletActivity = 'walletActivity',
  Perps = 'perps',
  SocialAI = 'socialAI',
  Marketing = 'marketing',
}

/**
 * Metadata for a single notification category, as returned by
 * `GET /api/v1/notifications/categories?locale=<locale>`. `id` matches the
 * Authenticated User Storage notification-preference key 1:1 (see
 * `NotificationPreferences` in `@metamask/authenticated-user-storage`), so a
 * category can be cross-referenced with its opt-in/opt-out toggle.
 */
export type NotificationCategoryMetadata = {
  id: Exclude<NotificationCategoryId, NotificationCategoryId.All>;
  label: string;
  description: string;
  icon: string;
};
