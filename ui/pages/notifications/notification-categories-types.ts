/**
 * Client-only sentinel for the "All" tab - not a real BE category, so it
 * can't collide with a real `categoryId` (which is free-form server data).
 */
export const ALL_NOTIFICATIONS_CATEGORY_ID = 'all';

/**
 * Metadata for a single notification category, as returned by
 * `GET /api/v1/notifications/categories?locale=<locale>`.
 *
 * `categoryId` is a free-form, BE-assigned id used only for grouping/
 * filtering notifications in the inbox (matched against each notification's
 * own `category` field) - it is NOT an Authenticated User Storage
 * preference key. A single category can span multiple AUS preferences
 * (e.g. several raw notification types feeding one macro category, each
 * governed by a different toggle), hence `ausKeys` is an array: toggling a
 * category's push/in-app switch means writing that value to every key in
 * this list.
 */
export type NotificationCategoryMetadata = {
  categoryId: string;
  ausKeys: string[];
  label: string;
  description: string;
  icon: string;
};
