import { enableNotificationsFirstTime } from '../../page-objects/flows/enable-notifications';
import NotificationsListPage from '../../page-objects/pages/notifications/notifications-list';
import { mockNotificationServices } from './mocks';

const {
  withFixtures,
  logInWithBalanceValidation,
  defaultGanacheOptions,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Notifications', function () {
  describe('from inside MetaMask', function () {
    it('enables notifications for the first time', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          ganacheOptions: defaultGanacheOptions,
          title: this.test.fullTitle(),
          testSpecificMock: mockNotificationServices,
        },
        async ({ driver, ganacheServer }) => {
          await logInWithBalanceValidation(driver, ganacheServer);
          await enableNotificationsFirstTime(driver);

          // should land on notifications list
          const notificationsListPage = new NotificationsListPage(driver);
          await notificationsListPage.check_pageIsLoaded();
          await notificationsListPage.check_noNotificationsReceived();
        },
      );
    });
  });
});
