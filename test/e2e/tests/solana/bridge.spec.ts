import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import SwapPage from '../../page-objects/pages/swap/swap-page';
import ConfirmSolanaTxPage from '../../page-objects/pages/send/solana-confirm-tx-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HomePage from '../../page-objects/pages/home/homepage';
import { switchToNetworkFlow } from '../../page-objects/flows/network.flow';
import { withSolanaAccountSnap } from './common-solana';

describe('Bridge on Solana', function () {
  // Investigate why this test is flaky https://consensyssoftware.atlassian.net/browse/MMQA-549
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('Completes a bridge between native SOL and native ETH', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
        mockBridgeSOLtoEth: true,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);
        await homePage.check_pageIsLoaded('50');
        await homePage.clickOnBridgeButton();
        const swapPage = new SwapPage(driver);
        const quote = {
          fromChain: 'Solana',
          toChain: 'Ethereum',
          tokenFrom: 'SOL',
          tokenTo: 'ETH',
          swapToAmount: '0.0586',
          swapFromAmount: '0.03',
          skipCounter: true,
        };
        await swapPage.createSwap(quote);
        await swapPage.clickOnMoreQuotes();

        await swapPage.checkQuote({
          totalCost: '$3.39',
          receivedAmount: '0.00128 ETH',
          estimatedTime: '< 1 min',
          provider: 'Mayan Via Li Fi',
        });

        await swapPage.checkQuote({
          totalCost: '$3.42',
          receivedAmount: '0.0013 ETH',
          estimatedTime: '1 min',
          provider: 'Mayan Via Rango',
        });
        await swapPage.closeQuotes();

        await swapPage.reviewSolanaQuote({
          swapToAmount: '0.00128',
          swapToConversionRate: '0.0427',
          tokenFrom: 'SOL',
          tokenTo: 'ETH',
          swapFromAmount: '0.03',
          fromChain: 'Solana',
          toChain: 'Ethereum',
        });

        const confirmSolanaPage = new ConfirmSolanaTxPage(driver);
        await confirmSolanaPage.clickOnConfirm();

        const activityListPage = new ActivityListPage(driver);
        // await activityListPage.check_txAmountInActivity('-0.03 SOL', 1);
        await activityListPage.check_waitForTransactionStatus('confirmed');
        await activityListPage.check_transactionActivityByText(
          'Bridged SOL to ETH',
        );
      },
    );
  });
  it('Completes a bridge between native ETH and native SOL', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
        mockBridgeEthtoSol: true,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);
        await homePage.check_pageIsLoaded('50');
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.selectAccount('Account 1');
        await switchToNetworkFlow(driver, 'Ethereum Mainnet');
        const evmHomePage = new HomePage(driver);
        await evmHomePage.startBridgeFlow();

        const swapPage = new SwapPage(driver);
        const quote = {
          fromChain: 'Ethereum',
          toChain: 'Solana',
          tokenFrom: 'ETH',
          tokenTo: 'SOL',
          swapToAmount: '0.0122',
          swapFromAmount: '0.001',
          skipCounter: true,
        };

        await swapPage.createSwap(quote);

        await swapPage.reviewSolanaQuote({
          swapToAmount: '0.0166',
          swapToConversionRate: '16.56',
          tokenFrom: 'ETH',
          tokenTo: 'SOL',
          swapFromAmount: '0.001',
          fromChain: 'Solana',
          toChain: 'Ethereum',
        });

        const activityListPage = new ActivityListPage(driver);
        // await activityListPage.check_txAmountInActivity('-0.03 SOL', 1);
        await activityListPage.check_transactionActivityByText(
          'Bridged to Solana',
        );
      },
    );
  });
  it('Bridge has no quotes available', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
        mockBridgeSOLtoEth: true,
        mockSwapWithNoQuotes: true,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);
        await homePage.check_pageIsLoaded('50');
        await homePage.clickOnBridgeButton();
        const swapPage = new SwapPage(driver);
        const quote = {
          fromChain: 'Solana',
          toChain: 'Ethereum',
          tokenFrom: 'SOL',
          tokenTo: 'ETH',
          swapToAmount: '0.0586',
          swapFromAmount: '0.03',
          skipCounter: true,
        };

        await swapPage.createSwap(quote);
        await swapPage.checkNoQuotesAvailable();
      },
    );
  });
});
