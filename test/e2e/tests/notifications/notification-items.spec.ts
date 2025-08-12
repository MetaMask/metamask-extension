import { Mockttp } from 'mockttp';
import { TRIGGER_TYPES } from '@metamask/notification-services-controller/notification-services';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
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

describe('Notification List - View Items and Details', function () {
  it('find each notification type we support, and navigates to their details page', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (server: Mockttp) => {
          await mockNotificationServices(
            server,
            new MockttpNotificationTriggerServer(),
          );
        },
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);
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
