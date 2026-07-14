import type { INotification } from '@metamask/notification-services-controller/notification-services';

/**
 * Not yet part of `INotification` upstream - BE is expected to tag every
 * notification with the `categoryId` of the category catalog entry
 * (`GET /api/v1/notifications/categories`) it belongs to.
 */
type NotificationWithCategory = { category?: string };

/**
 * Reads the BE-assigned category id off a notification, if present. This is
 * a straight field read (not a client-side classification), matching a
 * `NotificationCategoryMetadata.categoryId` from the categories catalog.
 * Returns `undefined` for notifications the BE hasn't categorized (e.g.
 * today's real data, which doesn't carry this field yet) - those only show
 * under "All".
 *
 * @param notification - The notification to read the category off of.
 * @returns The notification's category id, or `undefined` if uncategorized.
 */
export function getNotificationCategoryId(
  notification: INotification,
): string | undefined {
  return (notification as unknown as NotificationWithCategory).category;
}
