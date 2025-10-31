import { Suite } from 'mocha';
import { unlockWallet, veryLargeDelayMs, withFixtures } from '../../helpers';
import HomePage from '../../page-objects/pages/home/homepage';
import BridgeQuotePage from '../../page-objects/pages/bridge/quote-page';
import NetworkManager from '../../page-objects/pages/network-manager';
import {
  BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
  DEFAULT_BRIDGE_FEATURE_FLAGS,
} from './constants';
import { bridgeTransaction, getBridgeFixtures } from './bridge-test-utils';

describe('Bridge tests', function (this: Suite) {
  this.timeout(160000); // This test is very long, so we need an unusually high timeout
  it('Execute multiple bridge transactions', async function () {
    await withFixtures(
      getBridgeFixtures(
        this.test?.fullTitle(),
        DEFAULT_BRIDGE_FEATURE_FLAGS,
        false,
      ),
      async ({ driver }) => {
        await unlockWallet(driver);

        const homePage = new HomePage(driver);

        await bridgeTransaction({
          driver,
          quote: {
            amount: '25',
            tokenFrom: 'DAI',
            tokenTo: 'ETH',
            fromChain: 'Ethereum',
            toChain: 'Linea',
            unapproved: true,
          },
          expectedTransactionsCount: 2,
          expectedDestAmount: '0.0157',
        });

        await bridgeTransaction({
          driver,
          quote: {
            amount: '1',
            tokenFrom: 'ETH',
            tokenTo: 'USDC',
            fromChain: 'Ethereum',
            toChain: 'Arbitrum',
          },
          expectedTransactionsCount: 3,
          expectedDestAmount: '1,642',
        });
        await bridgeTransaction({
          driver,
          quote: {
            amount: '1',
            tokenFrom: 'ETH',
            tokenTo: 'ETH',
            fromChain: 'Ethereum',
            toChain: 'Linea',
          },
          expectedTransactionsCount: 4,
          expectedDestAmount: '0.991',
        });

        await homePage.checkPageIsLoaded();
        await homePage.goToTokensTab();
        await homePage.goToActivityList();

        await bridgeTransaction({
          driver,
          quote: {
            amount: '10',
            tokenFrom: 'USDC',
            tokenTo: 'DAI',
            fromChain: 'Ethereum',
            toChain: 'Linea',
            unapproved: true,
          },
          expectedTransactionsCount: 6,
          expectedDestAmount: '9.9',
        });
      },
    );
  });

  it('Execute bridge transactions on non enabled networks', async function () {
    await withFixtures(
      getBridgeFixtures(
        this.test?.fullTitle(),
        DEFAULT_BRIDGE_FEATURE_FLAGS,
        false,
      ),
      async ({ driver }) => {
        await unlockWallet(driver);
        const networkManager = new NetworkManager(driver);

        // Navigate to Bridge page
        const homePage = new HomePage(driver);
        await homePage.startSwapFlow();

        const bridgePage = new BridgeQuotePage(driver);
        await bridgePage.enterBridgeQuote({
          amount: '25',
          tokenFrom: 'ETH',
          tokenTo: 'DAI',
          fromChain: 'Linea',
          toChain: 'Ethereum',
        });

        await bridgePage.goBack();

        // check if the Linea network is selected
        await networkManager.openNetworkManager();
        await driver.delay(veryLargeDelayMs);

        await networkManager.checkAllPopularNetworksIsSelected();
      },
    );
  });

  it('updates recommended bridge quote incrementally when SSE events are received', async function () {
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
            amount: '10',
            tokenFrom: 'USDC',
            tokenTo: 'DAI',
            fromChain: 'Ethereum',
            toChain: 'Linea',
            unapproved: true,
          },
          expectedTransactionsCount: 2,
          expectedDestAmount: '9.9',
        });
      },
    );
  });
});
