import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import SwapPage from '../../page-objects/pages/swap/swap-page';
import ConfirmSolanaTxPage from '../../page-objects/pages/send/solana-confirm-tx-page';
import { withSolanaAccountSnap } from './common-solana';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HomePage from '../../page-objects/pages/home/homepage';
import { switchToNetworkFlow } from '../../page-objects/flows/network.flow';

describe('Bridge on Solana', function () {
  it.only('Completes a bridge between native SOL and native ETH', async function () {
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
        }

        await swapPage.createSwap(quote);
        await swapPage.clickOnMoreQuotes();

        await swapPage.checkQuote({
          totalCost: '$112.87',
          receivedAmount: '0.0586 ETH',
          estimatedTime: '< 1 min',
          provider: 'Relay Via Li Fi',
        });
        await swapPage.checkQuote({
          totalCost: '$112.87',
          receivedAmount: '0.0581 ETH',
          estimatedTime: '< 1 min',
          provider: 'Mayan Via Li Fi',
        });
        await swapPage.checkQuote({
          totalCost: '$112.87',
          receivedAmount: '0.0554 ETH',
          estimatedTime: '1 min',
          provider: 'Mayan MCTP Via Li Fi',
        });
        await swapPage.closeQuotes();
        await swapPage.reviewSolanaQuote({
          swapToAmount: '0.0586',
          swapToConversionRate: '0.0586',
          tokenFrom: 'SOL',
          tokenTo: 'ETH',
          swapFromAmount: '0.03',
          fromChain: 'Solana',
          toChain: 'Ethereum',
        });

        const confirmSolanaPage = new ConfirmSolanaTxPage(driver);
        await confirmSolanaPage.clickOnConfirm();

        const activityListPage = new ActivityListPage(driver);
        //await activityListPage.check_txAmountInActivity('-0.03 SOL', 1);
        await activityListPage.check_waitForTransactionStatus('confirmed');
        await driver.delay(10000000)
        await activityListPage.check_swapTransactionActivity(
          'Bridge SOL to ETH',
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
        }

        await swapPage.createSwap(quote);
        await driver.delay(3000);

        /*await swapPage.clickOnMoreQuotes();
        await swapPage.checkQuote({
          totalCost: '$4.32',
          receivedAmount: '$2.51',
          estimatedTime: '< 1 min',
          provider: 'Relay Via Li Fi',
        });
        await swapPage.checkQuote({
          totalCost: '$4.68',
          receivedAmount: '$1.86',
          estimatedTime: '< 1 min',
          provider: 'Mayan Via Li Fi',
        });
        await swapPage.closeQuotes();*/
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
        //await activityListPage.check_txAmountInActivity('-0.03 SOL', 1);
        await activityListPage.check_waitForTransactionStatus('pending');
        await activityListPage.check_swapTransactionActivity(
          'Bridge to Solana',
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
        }

        await swapPage.createSwap(quote);
        await swapPage.checkNoQuotesAvailable();
      },
    );
  });
});
