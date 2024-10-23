import { Mockttp } from 'mockttp';
import {
  withFixtures,
  defaultGanacheOptions,
  completeImportSRPOnboardingFlow,
} from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import { mockNotificationServices } from '../mocks';
import {
  NOTIFICATIONS_TEAM_PASSWORD,
  NOTIFICATIONS_TEAM_SEED_PHRASE,
} from '../constants';
import { UserStorageMockttpController } from '../../../helpers/user-storage/userStorageMockttpController';
import { accountsSyncMockResponse } from './mockData';
import { IS_ACCOUNT_SYNCING_ENABLED } from './helpers';

describe('Account syncing @no-mmi', function () {
  if (!IS_ACCOUNT_SYNCING_ENABLED) {
    return;
  }
  describe('from inside MetaMask', function () {
    it('retrieves all previously synced accounts', async function () {
      const userStorageMockttpController = new UserStorageMockttpController();

      await withFixtures(
        {
          fixtures: new FixtureBuilder({ onboarding: true }).build(),
          ganacheOptions: defaultGanacheOptions,
          title: this.test?.fullTitle(),
          testSpecificMock: (server: Mockttp) => {
            userStorageMockttpController.setupPath('accounts', server, {
              getResponse: accountsSyncMockResponse,
            });
            return mockNotificationServices(
              server,
              userStorageMockttpController,
            );
          },
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
          }, 20000);
        },
      );
    });
  });
});
