import { Mockttp } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { withFixtures } from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import { mockIdentityServices } from '../mocks';
import { ACCOUNT_TYPE } from '../../../constants';
import {
  IDENTITY_TEAM_PASSWORD,
  IDENTITY_TEAM_SEED_PHRASE,
} from '../constants';
import { UserStorageMockttpController } from '../../../helpers/identity/user-storage/userStorageMockttpController';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import HomePage from '../../../page-objects/pages/home/homepage';
import { completeImportSRPOnboardingFlow } from '../../../page-objects/flows/onboarding.flow';
import { completeOnboardFlowIdentity } from '../flows';
import { IS_ACCOUNT_SYNCING_ENABLED } from './helpers';
import {
  accountsToMockForAccountsSync,
  getAccountsSyncMockResponse,
} from './mock-data';

describe('Account syncing - Add Account', async function () {
  if (!IS_ACCOUNT_SYNCING_ENABLED) {
    return;
  }

  const unencryptedAccounts = accountsToMockForAccountsSync;
  const mockedAccountSyncResponse = await getAccountsSyncMockResponse();
  const customNameAccount3 = '3rd Account';
  const defaultNameAccount3 = 'Account 3';

  describe('from inside MetaMask', function () {
    it('syncs newly added accounts - custom name', async function () {
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
          await accountListPage.addAccount({
            accountType: ACCOUNT_TYPE.Ethereum,
            accountName: customNameAccount3,
          });
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

          const accountSyncResponse = userStorageMockttpController.paths.get(
            USER_STORAGE_FEATURE_NAMES.accounts,
          )?.response;

          await accountListPage.check_numberOfAvailableAccounts(
            accountSyncResponse?.length as number,
          );
          await accountListPage.check_accountDisplayedInAccountList(
            unencryptedAccounts[0].n,
          );
          await accountListPage.check_accountDisplayedInAccountList(
            unencryptedAccounts[1].n,
          );
          await accountListPage.check_accountDisplayedInAccountList(
            customNameAccount3,
          );
        },
      );
    });

    it('syncs newly added accounts - default name', async function () {
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
          await accountListPage.addAccount({
            accountType: ACCOUNT_TYPE.Ethereum,
          });
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
          await completeImportSRPOnboardingFlow({
            driver,
            seedPhrase: IDENTITY_TEAM_SEED_PHRASE,
            password: IDENTITY_TEAM_PASSWORD,
          });
          const homePage = new HomePage(driver);
          await homePage.check_pageIsLoaded();
          await homePage.check_expectedBalanceIsDisplayed('0');

          const header = new HeaderNavbar(driver);
          await header.check_pageIsLoaded();
          await header.openAccountMenu();

          const accountListPage = new AccountListPage(driver);
          await accountListPage.check_pageIsLoaded();

          const accountSyncResponse = userStorageMockttpController.paths.get(
            USER_STORAGE_FEATURE_NAMES.accounts,
          )?.response;

          await accountListPage.check_numberOfAvailableAccounts(
            accountSyncResponse?.length as number,
          );
          await accountListPage.check_accountDisplayedInAccountList(
            unencryptedAccounts[0].n,
          );
          await accountListPage.check_accountDisplayedInAccountList(
            unencryptedAccounts[1].n,
          );
          await accountListPage.check_accountDisplayedInAccountList(
            defaultNameAccount3,
          );
        },
      );
    });
  });
});
