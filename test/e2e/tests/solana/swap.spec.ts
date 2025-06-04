import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import SwapPage from '../../page-objects/pages/swap/swap-page';
import ConfirmSolanaTxPage from '../../page-objects/pages/send/solana-confirm-tx-page';
import { withSolanaAccountSnap } from './common-solana';

describe('Swap on Solana', function () {
  it('Completes a Swap between SOL and SPL', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
        mockSwapSOLtoUSDC: true,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);

        await homePage.check_pageIsLoaded('50');
        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.createSolanaSwap({
          amount: 0.001,
          swapTo: 'USDC',
          swapFrom: 'SOL',
        });

        await swapPage.clickOnMoreQuotes();
        await swapPage.checkQuote({
          amount: '0.000005 SOL',
          totalCost: '0.000005 SOL',
          receivedAmount: '166.3 USDC',
          estimatedTime: '< 1 min',
          provider: 'Jupiter Via Li Fi',
        });
        await swapPage.checkQuote({
          amount: '0.000005 SOL',
          totalCost: '0.000005 SOL',
          receivedAmount: '167.7 USDC',
          estimatedTime: '< 1 min',
          provider: 'Sol Fi',
        });

        await swapPage.closeQuotes();

        await swapPage.reviewSolanaQuote({
          swapToAmount: 166.3,
          swapFrom: 'SOL',
          swapTo: 'USDC',
          swapFromAmount: 0,
        });

        const confirmSolanaPage = new ConfirmSolanaTxPage(driver);
        console.log('confirmSolanaPage', confirmSolanaPage);

        await confirmSolanaPage.clickOnConfirm();

        const activityListPage = new ActivityListPage(driver);
        await activityListPage.check_txAmountInActivity('-0.001 SOL', 1);

        await activityListPage.check_swapTransactionActivity(
          'Swap SOL to USDC',
        );
      },
    );
  });
  it('Completes a Swap between SPL and SOL', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
        mockSwapUSDtoSOL: true,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);

        await homePage.check_pageIsLoaded('50');
        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.createSolanaSwap({
          amount: 1,
          swapTo: 'SOL',
          swapFrom: 'USDC',
        });
        await swapPage.reviewSolanaQuote({
          swapToAmount: 0.00584,
          swapFrom: 'USDC',
          swapTo: 'SOL',
          swapFromAmount: 0,
        });

        const confirmSolanaPage = new ConfirmSolanaTxPage(driver);

        await confirmSolanaPage.clickOnConfirm();

        const activityListPage = new ActivityListPage(driver);
        await activityListPage.check_txAmountInActivity('-1 USDC', 1);

        await activityListPage.check_swapTransactionActivity(
          'Swap USDC to SOL',
        );
      },
    );
  });
  it('Swap has no quotes available', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
        mockSwapWithNoQuotes: true,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);

        await homePage.check_pageIsLoaded('50');
        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.createSolanaSwap({
          amount: 0.001,
          swapTo: 'USDC',
          swapFrom: 'SOL',
        });
        await swapPage.checkNoQuotesAvailable();
      },
    );
  });
});
