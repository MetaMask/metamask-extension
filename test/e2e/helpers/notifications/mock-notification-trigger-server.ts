import { CompletedRequest, Mockttp } from 'mockttp';
import type { NotificationPreferences } from '@metamask/authenticated-user-storage';
import {
  getMockOnChainNotificationsConfig,
  getMockUpdateOnChainNotifications,
} from '@metamask/notification-services-controller/notification-services/mocks';

const GET_CONFIG_URL = getMockOnChainNotificationsConfig().url;
const UPDATE_CONFIG_URL = getMockUpdateOnChainNotifications().url;
const AUTHENTICATED_USER_STORAGE_NOTIFICATION_PREFERENCES_URL =
  /^https:\/\/user-storage\.(?:dev-api|uat-api|api)\.cx\.metamask\.io\/api\/v1\/preferences\/notifications$/u;

export type NotificationConfig = {
  address: string;
  enabled: boolean;
};

export class MockttpNotificationTriggerServer {
  // Store notification configs by address
  private notificationConfigs: Map<string, boolean> = new Map();

  private notificationPreferences: NotificationPreferences | null = null;

  readonly getConfig = async (
    request: Pick<CompletedRequest, 'body'>,
    statusCode: number = 200,
  ) => {
    const requestBody = (await request.body.getJson()) as { address: string }[];

    const response: NotificationConfig[] = requestBody.map(({ address }) => {
      const normalizedAddress = address.toLowerCase();
      // Return saved config or default to false for new addresses
      const enabled = this.notificationConfigs.get(normalizedAddress) ?? false;

      return {
        address: normalizedAddress,
        enabled,
      };
    });

    return {
      statusCode,
      json: response,
    };
  };

  /**
   * Handles the per-address upsert performed when accounts are
   * enabled or disabled, including during first-time setup.
   *
   * @param request - Trigger API request containing account configurations.
   * @param statusCode - HTTP status returned by the mock.
   * @returns The mock HTTP response.
   */
  readonly updateConfig = async (
    request: Pick<CompletedRequest, 'body'>,
    statusCode: number = 204,
  ) => {
    const requestBody = (await request.body.getJson()) as NotificationConfig[];

    for (const { address, enabled } of requestBody) {
      this.notificationConfigs.set(address.toLowerCase(), enabled);
    }

    return {
      statusCode,
    };
  };

  setupServer = (server: Mockttp) => {
    server
      .forPost(GET_CONFIG_URL)
      .always()
      .thenCallback((request) => this.getConfig(request));

    server
      .forPost(UPDATE_CONFIG_URL)
      .always()
      .thenCallback((request) => this.updateConfig(request));

    server
      .forGet(AUTHENTICATED_USER_STORAGE_NOTIFICATION_PREFERENCES_URL)
      .always()
      .thenCallback(() => {
        if (!this.notificationPreferences) {
          return {
            statusCode: 404,
          };
        }

        return {
          statusCode: 200,
          json: this.notificationPreferences,
        };
      });

    server
      .forPut(AUTHENTICATED_USER_STORAGE_NOTIFICATION_PREFERENCES_URL)
      .always()
      .thenCallback(async (request) => {
        this.notificationPreferences =
          (await request.body.getJson()) as NotificationPreferences;

        return {
          statusCode: 200,
        };
      });
  };

  // Helper methods for testing
  setNotificationConfig(address: string, enabled: boolean) {
    this.notificationConfigs.set(address.toLowerCase(), enabled);
  }

  getNotificationConfig(address: string): boolean | undefined {
    return this.notificationConfigs.get(address.toLowerCase());
  }

  /**
   * Returns the notification preferences last persisted to authenticated user
   * storage (via PUT), or null if none have been written yet.
   */
  getNotificationPreferences(): NotificationPreferences | null {
    return this.notificationPreferences;
  }

  clearConfigs() {
    this.notificationConfigs.clear();
    this.notificationPreferences = null;
  }

  reset() {
    this.clearConfigs();
  }
}
