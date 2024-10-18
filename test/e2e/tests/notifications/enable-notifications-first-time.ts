import {
  withFixtures,
  logInWithBalanceValidation,
  defaultGanacheOptions,
  completeImportSRPOnboardingFlow,
} from '../../helpers';
import { enableNotificationsFirstTime } from '../../page-objects/flows/enable-notifications';
import FixtureBuilder from '../../fixture-builder';
import NotificationsListPage from '../../page-objects/pages/notifications/notifications-list';
import { mockNotificationServices } from './mocks';

const NOTIFICATIONS_TEAM_SEED_PHRASE =
  'leisure swallow trip elbow prison wait rely keep supply hole general mountain';

const PASSWORD = 'notify_password';

describe('Notifications', function () {
  describe('from inside MetaMask', function () {
    it('enables notifications for the first time', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder({ onboarding: true })
            .withMetamaskNotifications()
            .build(),
          ganacheOptions: defaultGanacheOptions,
          title: this.test?.fullTitle(),
          testSpecificMock: mockNotificationServices,
        },
        async ({ driver }) => {
          await driver.navigate();
          await completeImportSRPOnboardingFlow(
            driver,
            NOTIFICATIONS_TEAM_SEED_PHRASE,
            PASSWORD,
          );
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
