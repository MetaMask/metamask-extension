import { Mockttp } from 'mockttp';
import { TRIGGER_TYPES } from '@metamask/notification-services-controller/notification-services';
import { login } from '../../page-objects/flows/login.flow';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import { getProductionRemoteFlagApiResponse } from '../../feature-flags';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import {
  enableNotificationsThroughGlobalMenu,
  clickNotificationItemAndDetailsPage,
  navigateToNotificationSettingsAndClickDisable,
} from '../../page-objects/flows/notifications.flow';
import NotificationsSettingsPage from '../../page-objects/pages/settings/notifications-settings-page';
import { MockttpNotificationTriggerServer } from '../../helpers/notifications/mock-notification-trigger-server';
import {
  getMockFeatureAnnouncementItemId,
  getMockWalletNotificationItemId,
  mockNotificationServices,
} from './mocks';

const FEATURE_FLAGS_URL = 'https://client-config.api.cx.metamask.io/v1/flags';

async function mockFeatureFlagsWithoutAutoEnableNotifications(server: Mockttp) {
  const prodFlags = getProductionRemoteFlagApiResponse();
  return await server
    .forGet(FEATURE_FLAGS_URL)
    .withQuery({
      client: 'extension',
      distribution: 'main',
      environment: 'dev',
    })
    .thenCallback(() => ({
      statusCode: 200,
      json: [
        ...prodFlags,
        { assetsEnableNotificationsByDefault: false },
        { assetsEnableNotificationsByDefaultV2: { value: false } },
      ],
    }));
}

describe('Notification List - View Items and Details', function () {
  it('find each notification type we support, and navigates to their details page', async function () {
    // Feature announcements are fetched from Contentful, which requires CONTENTFUL_ACCESS_SPACE_ID
    // and CONTENTFUL_ACCESS_TOKEN baked in at build time (run-build.yml). Fork repos and
    // cross-repo PRs don't have these secrets, so the built extension uses placeholder values,
    // never contacts Contentful, and this test times out waiting for announcement items.
    if (
      process.env.IS_FORK === 'true' ||
      process.env.IS_CROSS_REPO_PR === 'true'
    ) {
      this.skip();
    }
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (server: Mockttp) => {
          await mockNotificationServices(
            server,
            new MockttpNotificationTriggerServer(),
          );
          await mockFeatureFlagsWithoutAutoEnableNotifications(server);
        },
      },
      async ({ driver }) => {
        await login(driver, { validateBalance: false });
        await enableNotificationsThroughGlobalMenu(driver, false);
        await visitEachWalletNotificationItemAndDetailsPage(driver);
        await visitEachFeatureAnnouncementNotificationItemAndDetailsPage(
          driver,
        );
        await navigateToNotificationSettingsAndClickDisable(driver);
        await new NotificationsSettingsPage(
          driver,
        ).checkNotificationSectionIsHidden();
      },
    );
  });

  /**
   * Click each wallet notification item by the testId and validate the details page appears
   *
   * @param driver
   */
  async function visitEachWalletNotificationItemAndDetailsPage(driver: Driver) {
    const walletNotifications = [
      TRIGGER_TYPES.ETH_SENT,
      TRIGGER_TYPES.ETH_RECEIVED,
      TRIGGER_TYPES.ERC20_SENT,
      TRIGGER_TYPES.ERC20_RECEIVED,
      TRIGGER_TYPES.ERC721_SENT,
      TRIGGER_TYPES.ERC721_RECEIVED,
      TRIGGER_TYPES.ERC1155_SENT,
      TRIGGER_TYPES.ERC1155_RECEIVED,
      TRIGGER_TYPES.METAMASK_SWAP_COMPLETED,
      TRIGGER_TYPES.ROCKETPOOL_STAKE_COMPLETED,
      TRIGGER_TYPES.ROCKETPOOL_UNSTAKE_COMPLETED,
      TRIGGER_TYPES.LIDO_STAKE_COMPLETED,
      TRIGGER_TYPES.LIDO_WITHDRAWAL_REQUESTED,
      TRIGGER_TYPES.LIDO_STAKE_READY_TO_BE_WITHDRAWN,
    ];
    for (const walletTrigger of walletNotifications) {
      const testId = getMockWalletNotificationItemId(walletTrigger);
      await clickNotificationItemAndDetailsPage(driver, testId);
    }
  }

  /**
   * Click each feature announcement notification item by the testId and validate the details page appears
   *
   * @param driver
   */
  async function visitEachFeatureAnnouncementNotificationItemAndDetailsPage(
    driver: Driver,
  ) {
    const testId = getMockFeatureAnnouncementItemId();
    await clickNotificationItemAndDetailsPage(driver, testId);
  }
});
