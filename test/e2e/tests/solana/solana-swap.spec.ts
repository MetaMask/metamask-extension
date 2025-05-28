import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import ConfirmSolanaTxPage from '../../page-objects/pages/send/solana-confirm-tx-page';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import { withSolanaAccountSnap } from './common-solana';
import SwapPage from '../../page-objects/pages/swap/swap-page';
import ActivityListPage from '../../page-objects/pages/home/activity-list';

describe('Send flow', function (this: Suite) {
  it('with some field validation', async function () {
    this.timeout(120000);
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
        mockCalls: true,
        mockSwap: true,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);
        await homePage.check_pageIsLoaded('0');
        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.createSolanaSwap({
          amount: 0.01,
          swapTo: 'USDC',
          swapFrom: 'SOL',});

        await swapPage.reviewSolanaQuote({
          swapToAmount: 174.7,
          swapFrom: 'SOL',
          swapTo: 'USDC',
          swapFromAmount: 0,
        });

        const confirmSolanaPage = new ConfirmSolanaTxPage(driver);

        await confirmSolanaPage.clickOnConfirm();

        const activityListPage = new ActivityListPage(driver);

        await activityListPage.check_txAmountInActivity('-0.01 SOL', 1);

        await activityListPage.check_swapTransactionActivity('Swap SOL to USDC');
        console.log('aqui no hace aun');
      },
    );
  });
});
