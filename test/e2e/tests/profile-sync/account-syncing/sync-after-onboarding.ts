import {
  withFixtures,
  defaultGanacheOptions,
  completeImportSRPOnboardingFlow,
} from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import { mockNotificationServices } from '../mocks';
import { accountsSyncMockResponse } from '../mockData';
import {
  NOTIFICATIONS_TEAM_PASSWORD,
  NOTIFICATIONS_TEAM_SEED_PHRASE,
} from '../constants';

describe('Account syncing', function () {
  describe('from inside MetaMask', function () {
    it('retrieves all previously synced accounts', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder({ onboarding: true }).build(),
          ganacheOptions: defaultGanacheOptions,
          title: this.test?.fullTitle(),
          testSpecificMock: mockNotificationServices,
        },
        async ({ driver }) => {
          await driver.navigate();
          await completeImportSRPOnboardingFlow(
            driver,
            NOTIFICATIONS_TEAM_SEED_PHRASE,
            NOTIFICATIONS_TEAM_PASSWORD,
          );

          await driver.clickElement('[data-testid="account-menu-icon"]');

          await driver.wait(async () => {
            const internalAccounts = await driver.findElements(
              '.multichain-account-list-item',
            );
            return internalAccounts.length === accountsSyncMockResponse.length;
          }, 10000);
        },
      );
    });
  });
});
