import { Mockttp } from 'mockttp';
import type { NotificationPreferences } from '@metamask/authenticated-user-storage';

const AUTHENTICATED_USER_STORAGE_NOTIFICATION_PREFERENCES_URL =
  /^https:\/\/user-storage\.(?:dev-api|uat-api|api)\.cx\.metamask\.io\/api\/v1\/preferences\/notifications$/u;

/**
 * E2E mock setup for Authenticated User Storage notification preferences.
 *
 * @param server - server obj used to mock our endpoints
 */
export function mockAuthenticatedUserStorageNotificationPreferences(
  server: Mockttp,
) {
  let notificationPreferences: NotificationPreferences | null = null;

  server
    .forGet(AUTHENTICATED_USER_STORAGE_NOTIFICATION_PREFERENCES_URL)
    .always()
    .thenCallback(() => {
      if (!notificationPreferences) {
        return { statusCode: 404 };
      }

      return {
        statusCode: 200,
        json: notificationPreferences,
      };
    });

  server
    .forPut(AUTHENTICATED_USER_STORAGE_NOTIFICATION_PREFERENCES_URL)
    .always()
    .thenCallback(async (request) => {
      notificationPreferences =
        (await request.body.getJson()) as NotificationPreferences;

      return {
        statusCode: 200,
      };
    });
}
