import { generateWalletState } from '../../../../app/scripts/fixtures/generate-wallet-state';
import { WITH_STATE_POWER_USER } from '../../benchmarks/constants';
import { withFixtures } from '../../helpers';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import { Driver } from '../../webdriver/driver';

describe('Power user persona', function () {
  it('loads the requested number of accounts', async function () {
    if (!process.env.INFURA_PROJECT_ID) {
      throw new Error(
        'Running this E2E test requires a valid process.env.INFURA_PROJECT_ID',
      );
    }

    await withFixtures(
      {
        title: this.test?.fullTitle(),
        fixtures: (
          await generateWalletState(WITH_STATE_POWER_USER, true)
        ).build(),
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
          WITH_STATE_POWER_USER.withAccounts,
        );

        // Confirm that the last account is displayed in the account list
        await accountListPage.checkAccountDisplayedInAccountList(
          `Account ${WITH_STATE_POWER_USER.withAccounts}`,
        );
      },
    );
  });
});
