import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { withFixtures } from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import { mockIdentityServices } from '../mocks';
import { UserStorageMockttpController } from '../../../helpers/identity/user-storage/userStorageMockttpController';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import AccountDetailsModal from '../../../page-objects/pages/dialog/account-details-modal';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import HomePage from '../../../page-objects/pages/home/homepage';
import { completeOnboardFlowIdentity } from '../flows';
import { IS_ACCOUNT_SYNCING_ENABLED } from './helpers';
import {
  accountsToMockForAccountsSync,
  getAccountsSyncMockResponse,
} from './mock-data';

describe('Account syncing - Rename Accounts', async function () {
  if (!IS_ACCOUNT_SYNCING_ENABLED) {
    return;
  }

  const unencryptedAccounts = accountsToMockForAccountsSync;
  const mockedAccountSyncResponse = await getAccountsSyncMockResponse();
  const accountOneNewName = 'Account One New Name';

  describe('from inside MetaMask', function () {
    it('syncs renamed account names', async function () {
      const userStorageMockttpController = new UserStorageMockttpController();

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
          const homePage = new HomePage(driver);
          await homePage.check_hasAccountSyncingSyncedAtLeastOnce();

          const header = new HeaderNavbar(driver);
          await header.check_pageIsLoaded();
          await header.openAccountMenu();

          const accountListPage = new AccountListPage(driver);
          await accountListPage.check_pageIsLoaded();
          await accountListPage.check_numberOfAvailableAccounts(
            mockedAccountSyncResponse.length,
          );
          await accountListPage.check_accountDisplayedInAccountList(
            unencryptedAccounts[0].n,
          );
          await accountListPage.check_accountDisplayedInAccountList(
            unencryptedAccounts[1].n,
          );
          await accountListPage.openAccountDetailsModal(
            unencryptedAccounts[0].n,
          );
          const accountDetailsModal = new AccountDetailsModal(driver);
          await accountDetailsModal.check_pageIsLoaded();
          await accountDetailsModal.changeAccountLabel(accountOneNewName);
        },
      );

      await withFixtures(
        {
          fixtures: new FixtureBuilder({ onboarding: true }).build(),
          title: this.test?.fullTitle(),
          testSpecificMock: (server: Mockttp) => {
            userStorageMockttpController.setupPath(
              USER_STORAGE_FEATURE_NAMES.accounts,
              server,
            );
            return mockIdentityServices(server, userStorageMockttpController);
          },
        },
        async ({ driver }) => {
          await completeOnboardFlowIdentity(driver);
          const homePage = new HomePage(driver);
          await homePage.check_hasAccountSyncingSyncedAtLeastOnce();

          const header = new HeaderNavbar(driver);
          await header.check_pageIsLoaded();
          await header.openAccountMenu();

          const accountListPage = new AccountListPage(driver);
          await accountListPage.check_pageIsLoaded();
          await accountListPage.check_numberOfAvailableAccounts(
            mockedAccountSyncResponse.length,
          );
          await accountListPage.check_accountIsNotDisplayedInAccountList(
            unencryptedAccounts[0].n,
          );
          await accountListPage.check_accountDisplayedInAccountList(
            accountOneNewName,
          );
          await accountListPage.check_accountDisplayedInAccountList(
            unencryptedAccounts[1].n,
          );
        },
      );
    });
  });
});
