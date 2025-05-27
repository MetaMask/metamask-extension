
import { withSolanaAccountSnap } from './common-solana';

import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import SwapPage from '../../page-objects/pages/swap/swap-page';
import ConfirmSolanaTxPage from '../../page-objects/pages/send/solana-confirm-tx-page';
const swapRate = 174.7;
describe('Swap on Solana', function () {
  it('Completes a Swap between SOL and SPL', async function () {
    this.timeout(100000000)
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
        mockCalls: true,
        mockSwap: true,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);
        await homePage.check_pageIsLoaded('50');
        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.createSolanaSwap({
          amount: 0.01,
          swapTo: 'USDC',
          swapFrom: 'SOL',});

        await swapPage.reviewSolanaQuote({
          swapToAmount: swapRate,
          swapFrom: 'SOL',
          swapTo: 'USDC',
          swapFromAmount: 0,
        });

        const confirmSolanaPage = new ConfirmSolanaTxPage(driver);
        console.log('confirmSolanaPage', confirmSolanaPage);

        await confirmSolanaPage.clickOnConfirm();

        const activityListPage = new ActivityListPage(driver);

        await activityListPage.check_txAmountInActivity('-0.01 SOL', 1);

        await activityListPage.check_swapTransactionActivity('Swap SOL to USDC');
        await driver.delay(1000)
      }
    );
  });
})
