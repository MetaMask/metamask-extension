import { Suite } from 'mocha';
import { unlockWallet, veryLargeDelayMs, withFixtures } from '../../helpers';
import HomePage from '../../page-objects/pages/home/homepage';
import {
  switchToNetworkFromSendFlow,
  searchAndSwitchToNetworkFromSendFlow,
} from '../../page-objects/flows/network.flow';
import BridgeQuotePage from '../../page-objects/pages/bridge/quote-page';
import NetworkManager from '../../page-objects/pages/network-manager';
import { DEFAULT_BRIDGE_FEATURE_FLAGS } from './constants';
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

        await bridgeTransaction(
          driver,
          {
            amount: '25',
            tokenFrom: 'DAI',
            tokenTo: 'ETH',
            fromChain: 'Ethereum',
            toChain: 'Linea',
            unapproved: true,
          },
          2,
        );

        // Switch to Linea Mainnet to set it as the selected network
        // in the network-controller
        await switchToNetworkFromSendFlow(driver, 'Linea');

        await bridgeTransaction(
          driver,
          {
            amount: '1',
            tokenFrom: 'ETH',
            tokenTo: 'USDC',
            fromChain: 'Ethereum',
            toChain: 'Arbitrum',
          },
          3,
        );

        await bridgeTransaction(
          driver,
          {
            amount: '1',
            tokenFrom: 'ETH',
            tokenTo: 'ETH',
            fromChain: 'Ethereum',
            toChain: 'Linea',
          },
          4,
        );

        // Switch to Arbitrum to set it as the selected network
        // in the network-controller
        await homePage.checkPageIsLoaded();
        await homePage.goToTokensTab();
        await searchAndSwitchToNetworkFromSendFlow(driver, 'Arbitrum');
        await homePage.goToActivityList();

        await bridgeTransaction(
          driver,
          {
            amount: '10',
            tokenFrom: 'USDC',
            tokenTo: 'DAI',
            fromChain: 'Ethereum',
            toChain: 'Linea',
            unapproved: true,
          },
          6,
        );
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
        await homePage.startBridgeFlow();

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
});
