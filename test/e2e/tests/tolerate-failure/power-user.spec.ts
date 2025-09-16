import { generateWalletState } from '../../../../app/scripts/fixtures/generate-wallet-state';
import { withFixtures } from '../../helpers';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import { Driver } from '../../webdriver/driver';

const withState = {
  withAccounts: 30,
  withConfirmedTransactions: 40,
  withContacts: 40,
  withErc20Tokens: true,
  withNetworks: true,
  withPreferences: true,
  withUnreadNotifications: 15,
};

describe('Power user persona', function () {
  it('loads the requested number of accounts', async function () {
    await withFixtures(
      {
        title: this.test?.fullTitle(),
        fixtures: (await generateWalletState(withState, true)).build(),
        manifestFlags: {
          testing: {
            disableSync: true,
            infuraProjectId: process.env.INFURA_PROJECT_ID,
          },
        },
        useMockingPassThrough: true,
        disableServerMochaToBackground: true,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        // Confirm the number of accounts in the account list
        new HeaderNavbar(driver).openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkNumberOfAvailableAccounts(
          withState.withAccounts,
        );

        // Confirm that the last account is displayed in the account list
        await accountListPage.checkAccountDisplayedInAccountList(
          `Account ${withState.withAccounts}`,
        );
      },
    );
  });
});
