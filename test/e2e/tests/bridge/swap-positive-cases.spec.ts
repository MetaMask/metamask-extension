import { Suite } from 'mocha';
import { unlockWallet, withFixtures } from '../../helpers';
import HomePage from '../../page-objects/pages/home/homepage';
import { BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED } from './constants';
import { bridgeTransaction, getBridgeFixtures } from './bridge-test-utils';

describe('Swap tests', function (this: Suite) {
  this.timeout(160000); // This test is very long, so we need an unusually high timeout
  it('updates recommended swap quote incrementally when SSE events are received', async function () {
    await withFixtures(
      getBridgeFixtures(
        this.test?.fullTitle(),
        BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
        false,
      ),
      async ({ driver }) => {
        await unlockWallet(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.goToTokensTab();
        await homePage.goToActivityList();

        await bridgeTransaction({
          driver,
          quote: {
            amount: '1',
          },
          expectedTransactionsCount: 1,
          expectedSwapTokens: {
            tokenFrom: 'ETH',
            tokenTo: 'MUSD',
          },
          submitDelay: 5000,
          expectedDestAmount: '3,839',
        });
      },
    );
  });
});
