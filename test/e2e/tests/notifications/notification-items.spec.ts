import { Mockttp } from 'mockttp';
import { TRIGGER_TYPES } from '@metamask/notification-services-controller/notification-services';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import NotificationsListPage from '../../page-objects/pages/notifications-list-page';
import { Driver } from '../../webdriver/driver';
import { completeOnboardFlowIdentity } from '../identity/flows';
import { UserStorageMockttpController } from '../../helpers/identity/user-storage/userStorageMockttpController';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import NotificationDetailsPage from '../../page-objects/pages/notification-details-page';
import {
  getMockFeatureAnnouncementItemId,
  getMockWalletNotificationItemId,
  mockNotificationServices,
} from './mocks';

describe('Notification List - View Items and Details', function () {
  async function onboard(driver: Driver) {
    await completeOnboardFlowIdentity(driver);
    const homePage = new HomePage(driver);
    await homePage.check_pageIsLoaded();
  }

  async function enableNotificationsThroughCTA(driver: Driver) {
    const headerNavbar = new HeaderNavbar(driver);
    await headerNavbar.check_pageIsLoaded();
    await headerNavbar.enableNotifications();
  }

  async function visitEachWalletNotificationItemAndDetailsPage(driver: Driver) {
    const notificationsListPage = new NotificationsListPage(driver);
    const notificationDetailsPage = new NotificationDetailsPage(driver);

    await notificationsListPage.check_pageIsLoaded();

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
      TRIGGER_TYPES.LIDO_WITHDRAWAL_COMPLETED,
    ];

    for (const walletTrigger of walletNotifications) {
      // inspect and click notification item
      const testId = getMockWalletNotificationItemId(walletTrigger);
      await notificationsListPage.check_notificationItemByTestId(testId);
      await notificationsListPage.clickNotificationItemByTestId(testId);
      // inspect and click notification details
      await notificationDetailsPage.check_pageIsLoaded();
      await notificationDetailsPage.clickBackButton();
    }
  }

  async function visitEachFeatureAnnouncementNotificationItemAndDetailsPage(
    driver: Driver,
  ) {
    const notificationsListPage = new NotificationsListPage(driver);
    const notificationDetailsPage = new NotificationDetailsPage(driver);

    await notificationsListPage.check_pageIsLoaded();

    // inspect and click notification item
    const testId = getMockFeatureAnnouncementItemId();
    await notificationsListPage.check_notificationItemByTestId(testId);
    await notificationsListPage.clickNotificationItemByTestId(testId);

    // inspect and click notification details
    await notificationDetailsPage.check_pageIsLoaded();
    await notificationDetailsPage.clickBackButton();
  }

  it('find each notification type we support, and navigates to their details page', async function () {
    const userStorageMockttpController = new UserStorageMockttpController();

    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withMetaMetricsController()
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (server: Mockttp) => {
          await mockNotificationServices(server, userStorageMockttpController);
        },
      },
      async ({ driver }) => {
        await onboard(driver);
        await enableNotificationsThroughCTA(driver);
        await visitEachWalletNotificationItemAndDetailsPage(driver);
        await visitEachFeatureAnnouncementNotificationItemAndDetailsPage(
          driver,
        );
      },
    );
  });
});
