import { Mockttp } from 'mockttp';
import { unlockWallet, withFixtures } from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import { mockInfuraAndAccountSync, mockNftApiCall } from '../mocks';
import {
  IDENTITY_TEAM_PASSWORD,
  IDENTITY_TEAM_SEED_PHRASE,
} from '../constants';
import { ACCOUNT_TYPE } from '../../../constants';
import {
  UserStorageMockttpController,
  UserStorageMockttpControllerEvents,
} from '../../../helpers/identity/user-storage/userStorageMockttpController';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import AccountDetailsModal from '../../../page-objects/pages/dialog/account-details-modal';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import HomePage from '../../../page-objects/pages/home/homepage';
import { completeImportSRPOnboardingFlow } from '../../../page-objects/flows/onboarding.flow';
import {
  accountsToMockForAccountsSync,
  getAccountsSyncMockResponse,
} from './mock-data';
import { arrangeTestUtils } from './helpers';

describe('Account syncing - User already has balances on multiple accounts', function () {
  this.timeout(160000); // This test is very long, so we need an unusually high timeout

  const arrange = async () => {
    const unencryptedAccounts = accountsToMockForAccountsSync;
    const mockedAccountSyncResponse = await getAccountsSyncMockResponse();

    const INITIAL_ACCOUNTS = [
      unencryptedAccounts[0].a,
      unencryptedAccounts[1].a,
      '0xd54ba25a07eb3da821face8478c3d965ded63018',
      '0x2c30c098e2a560988d486c7f25798e790802f953',
    ];

    const ADDITIONAL_ACCOUNTS = [
      '0x6b65DA6735119E72B72fF842Bd92e9DE0C1e4Ae0',
      '0x0f205850eaC507473AA0e47cc8eB528D875E7498',
    ];

    const EXPECTED_ACCOUNT_NAMES = {
      INITIAL: [
        unencryptedAccounts[0].n,
        unencryptedAccounts[1].n,
        'Account 3',
        'Account 4',
      ],
      WITH_NEW_ACCOUNTS: [
        unencryptedAccounts[0].n,
        unencryptedAccounts[1].n,
        'Account 3',
        'Account 4',
        'Account 5',
        'Account 6',
      ],
    };

    const userStorageMockttpController = new UserStorageMockttpController();

    return {
      mockedAccountSyncResponse,
      userStorageMockttpController,
      INITIAL_ACCOUNTS,
      ADDITIONAL_ACCOUNTS,
      EXPECTED_ACCOUNT_NAMES,
    };
  };

  describe('from inside MetaMask', function () {
    /**
     * This test verifies the complete account syncing flow in three phases:
     * Phase 1: Initial setup, where we check that 4 accounts are shown due to balance detection even though the user storage only has 2 accounts.
     * Phase 2: Discovery of 2 more accounts after adding balances. We still expect to only see 6 even though we had 5 accounts synced in the previous test
     * Phase 3: Verification that any final changes to user storage are persisted and that we don't see any extra accounts created
     */
    it('when a user has balances on more accounts than previously synced, it should be handled gracefully', async function () {
      const {
        mockedAccountSyncResponse,
        userStorageMockttpController,
        INITIAL_ACCOUNTS,
        ADDITIONAL_ACCOUNTS,
        EXPECTED_ACCOUNT_NAMES,
      } = await arrange();

      let accountsToMockBalances = [...INITIAL_ACCOUNTS];

      // PHASE 1: Initial setup and account creation
      await withFixtures(
        {
          fixtures: new FixtureBuilder({ onboarding: true })
            .withNetworkControllerOnMainnet()
            .build(),
          title: this.test?.fullTitle(),
          testSpecificMock: async (server: Mockttp) => {
            await mockInfuraAndAccountSync(
              server,
              userStorageMockttpController,
              {
                accountsSyncResponse: mockedAccountSyncResponse,
                accountsToMockBalances,
              },
            );
          },
        },
        async ({ driver }) => {
          // Complete initial setup with provided seed phrase
          await completeImportSRPOnboardingFlow({
            driver,
            seedPhrase: IDENTITY_TEAM_SEED_PHRASE,
            password: IDENTITY_TEAM_PASSWORD,
          });

          // Verify initial state and balance
          const homePage = new HomePage(driver);
          await homePage.check_pageIsLoaded();
          await homePage.check_expectedBalanceIsDisplayed('1');
          await homePage.check_hasAccountSyncingSyncedAtLeastOnce();

          // Open account menu and verify initial accounts
          const header = new HeaderNavbar(driver);
          await header.check_pageIsLoaded();
          await header.openAccountMenu();

          const accountListPage = new AccountListPage(driver);
          await accountListPage.check_pageIsLoaded();
          await accountListPage.check_numberOfAvailableAccounts(
            4,
            ACCOUNT_TYPE.Ethereum,
          );

          // Verify each initial account name
          for (const accountName of EXPECTED_ACCOUNT_NAMES.INITIAL) {
            await accountListPage.check_accountDisplayedInAccountList(
              accountName,
            );
          }

          // Create new account and prepare for additional accounts
          const { waitUntilSyncedAccountsNumberEquals } = arrangeTestUtils(
            driver,
            userStorageMockttpController,
          );

          await accountListPage.addAccount({
            accountType: ACCOUNT_TYPE.Ethereum,
          });
          // Wait for the account to be synced
          await waitUntilSyncedAccountsNumberEquals(5);

          accountsToMockBalances = [
            ...INITIAL_ACCOUNTS,
            ...ADDITIONAL_ACCOUNTS,
          ];
        },
      );

      // PHASE 2: Verify discovery of new accounts with balances
      await withFixtures(
        {
          fixtures: new FixtureBuilder({ onboarding: true })
            .withNetworkControllerOnMainnet()
            .build(),
          title: this.test?.fullTitle(),
          testSpecificMock: async (server: Mockttp) => {
            return [
              await mockInfuraAndAccountSync(
                server,
                userStorageMockttpController,
                { accountsToMockBalances },
              ),
              await mockNftApiCall(
                server,
                '0x0f205850eac507473aa0e47cc8eb528d875e7498',
              ),
            ];
          },
        },
        async ({ driver }) => {
          // Complete setup again for new session
          await completeImportSRPOnboardingFlow({
            driver,
            seedPhrase: IDENTITY_TEAM_SEED_PHRASE,
            password: IDENTITY_TEAM_PASSWORD,
          });

          const homePage = new HomePage(driver);
          await homePage.check_pageIsLoaded();
          await homePage.check_expectedBalanceIsDisplayed('1');
          await homePage.check_hasAccountSyncingSyncedAtLeastOnce();

          // Verify all accounts including newly discovered ones (which would have been synced / have balances)
          const header = new HeaderNavbar(driver);
          await header.check_pageIsLoaded();
          await header.openAccountMenu();

          const accountListPage = new AccountListPage(driver);
          await accountListPage.check_pageIsLoaded();
          await accountListPage.check_numberOfAvailableAccounts(
            6,
            ACCOUNT_TYPE.Ethereum,
          );

          for (const accountName of EXPECTED_ACCOUNT_NAMES.WITH_NEW_ACCOUNTS) {
            await accountListPage.check_accountDisplayedInAccountList(
              accountName,
            );
          }

          // Rename Account 6 to verify update to user storage
          await accountListPage.switchToAccount('Account 6');
          await header.check_accountLabel('Account 6');
          await header.openAccountMenu();
          await accountListPage.check_pageIsLoaded();
          await accountListPage.openAccountDetailsModal('Account 6');
          const accountDetailsModal = new AccountDetailsModal(driver);
          await accountDetailsModal.check_pageIsLoaded();

          const { prepareEventsEmittedCounter } = arrangeTestUtils(
            driver,
            userStorageMockttpController,
          );

          const { waitUntilEventsEmittedNumberEquals } =
            prepareEventsEmittedCounter(
              UserStorageMockttpControllerEvents.PUT_SINGLE,
            );

          await accountDetailsModal.changeAccountLabel('My Renamed Account 6');

          // Wait for the account name to be synced
          await waitUntilEventsEmittedNumberEquals(1);
        },
      );

      // PHASE 3: Verify name persistence across sessions
      await withFixtures(
        {
          fixtures: new FixtureBuilder({ onboarding: true })
            .withNetworkControllerOnMainnet()
            .build(),
          title: this.test?.fullTitle(),
          testSpecificMock: async (server: Mockttp) => {
            await mockInfuraAndAccountSync(
              server,
              userStorageMockttpController,
              { accountsToMockBalances },
            );
          },
        },
        async ({ driver }) => {
          // Complete setup for final verification
          await completeImportSRPOnboardingFlow({
            driver,
            seedPhrase: IDENTITY_TEAM_SEED_PHRASE,
            password: IDENTITY_TEAM_PASSWORD,
          });

          const homePage = new HomePage(driver);
          await homePage.check_pageIsLoaded();
          await homePage.check_expectedBalanceIsDisplayed('1');
          await homePage.check_hasAccountSyncingSyncedAtLeastOnce();

          // Verify renamed account persists
          const header = new HeaderNavbar(driver);
          await header.check_pageIsLoaded();
          await header.openAccountMenu();

          const accountListPage = new AccountListPage(driver);
          await accountListPage.check_pageIsLoaded();
          await accountListPage.check_numberOfAvailableAccounts(
            6,
            ACCOUNT_TYPE.Ethereum,
          );
          await accountListPage.check_accountDisplayedInAccountList(
            'My Renamed Account 6',
          );
          await accountListPage.closeAccountModal();

          // Lock and unlock wallet to ensure that number of preloaded accounts have not gone up
          await homePage.headerNavbar.lockMetaMask();
          await unlockWallet(driver, {
            password: IDENTITY_TEAM_PASSWORD,
            waitLoginSuccess: true,
            navigate: true,
          });

          await header.check_pageIsLoaded();
          await header.openAccountMenu();
          await accountListPage.check_numberOfAvailableAccounts(
            6,
            ACCOUNT_TYPE.Ethereum,
          );
        },
      );
    });
  });
});
