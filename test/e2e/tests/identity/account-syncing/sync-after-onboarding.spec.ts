import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { withFixtures } from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import { mockIdentityServices } from '../mocks';
import { UserStorageMockttpController } from '../../../helpers/identity/user-storage/userStorageMockttpController';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import { completeOnboardFlowIdentity } from '../flows';
import { ACCOUNT_TYPE } from '../../../constants';
import {
  accountsToMockForAccountsSync,
  getAccountsSyncMockResponse,
} from './mock-data';

describe('Account syncing - Onboarding', function () {
  this.timeout(160000); // This test is very long, so we need an unusually high timeout

  const arrange = async () => {
    const unencryptedAccounts = accountsToMockForAccountsSync;
    const mockedAccountSyncResponse = await getAccountsSyncMockResponse();

    const userStorageMockttpController = new UserStorageMockttpController();

    return {
      unencryptedAccounts,
      mockedAccountSyncResponse,
      userStorageMockttpController,
    };
  };

  describe('from inside MetaMask', function () {
    it('retrieves all previously synced accounts', async function () {
      const {
        unencryptedAccounts,
        mockedAccountSyncResponse,
        userStorageMockttpController,
      } = await arrange();

      await withFixtures(
        {
          fixtures: new FixtureBuilder({ onboarding: true }).build(),
          title: this.test?.fullTitle(),
          testSpecificMock: (server: Mockttp) => {
            userStorageMockttpController.setupPath(
              USER_STORAGE_FEATURE_NAMES.accounts,
              server,
              {
                getResponse: mockedAccountSyncResponse,
              },
            );
            return mockIdentityServices(server, userStorageMockttpController);
          },
        },
        async ({ driver }) => {
          await completeOnboardFlowIdentity(driver);

          const header = new HeaderNavbar(driver);
          await header.check_pageIsLoaded();
          await header.openAccountMenu();

          const accountListPage = new AccountListPage(driver);
          await accountListPage.check_pageIsLoaded();
          await accountListPage.check_numberOfAvailableAccounts(
            mockedAccountSyncResponse.length,
            ACCOUNT_TYPE.Ethereum,
          );
          await accountListPage.check_accountDisplayedInAccountList(
            unencryptedAccounts[0].n,
          );
          await accountListPage.check_accountDisplayedInAccountList(
            unencryptedAccounts[1].n,
          );
        },
      );
    });
  });
});
