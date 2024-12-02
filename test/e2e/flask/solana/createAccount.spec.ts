import accountList from '../../../../ui/components/ui/account-list';
import {
  enableExperimentalMode,
  openActionMenuAndStartSendFlow,
  unlockWallet,
  withFixtures,
} from '../../helpers';
import AccountListPage, {
  AccountType,
} from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import {
  buildQuote,
  changeExchangeRate,
  checkActivityTransaction,
  mockEthDaiTrade,
  reviewQuote,
  waitForTransactionToComplete,
  withFixturesOptions,
} from '../../tests/swaps/shared';
import { withSolanaAccountSnap } from './common-solana';

describe('Create Solana Account @no-mmi', function () {
  it('Create a new solana account', async function () {});

  it('Completes a Swap between ETH and DAI after changing initial rate', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        await unlockWallet(driver);
        await enableExperimentalMode(driver);
        await driver.clickElement({
          css: '[data-testid="solana-support-toggle-div"]',
        });
        await driver.delay(5000);
        const headerComponen = new HeaderNavbar(driver);
        await headerComponen.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.openAddAccountModal();
        await driver.delay(20000);
        await accountListPage.addNewAccountWithCustomLabel(
          'Solana Account',
          AccountType.SOLANA,
        );
        await driver.delay(120000);
      },
    );
  });
});
