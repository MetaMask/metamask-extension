import FixtureBuilder from '../../fixture-builder';
import { unlockWallet, withFixtures } from '../../helpers';
import { withSolanaAccountSnap } from './common-solana';
import {
  buildQuote,
  reviewQuote,
  waitForTransactionToComplete,
  checkActivityTransaction,
  changeExchangeRate,
  mockEthDaiTrade,
} from '../swaps/shared';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import { searchAndSwitchToNetworkFlow } from '../../page-objects/flows/network.flow';
import BridgeQuotePage from '../../page-objects/pages/bridge/quote-page';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import { bridgeTransaction } from '../bridge/bridge-test-utils';

// TODO: (MM-PENDING) These tests are planned for deprecation as part of swaps testing revamp
describe('Bridge scenario', function () {
  it('Completes a bridge transaction from Solana to Ethereum', async function () {
    this.timeout(1200000000);

    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
        mockCalls: true,
        mockBridge: true,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);
        await homePage.check_pageIsLoaded('50');
        await bridgeTransaction(
          driver,
          {
            amount: '1',
            tokenFrom: 'SOL',
            tokenTo: 'ETH',
            fromChain: 'Solana',
            toChain: 'Ethereum',
          },
          2,
          '49',
        );
      })
  });
});
