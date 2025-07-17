import { Suite } from 'mocha';
import { unlockWallet, withFixtures } from '../../helpers';
import HomePage from '../../page-objects/pages/home/homepage';
import {
  switchToNetworkFromSendFlow,
  searchAndSwitchToNetworkFromSendFlow,
} from '../../page-objects/flows/network.flow';
import { disableStxSetting } from '../../page-objects/flows/toggle-stx-setting.flow';
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

        // disable smart transactions step by step for all bridge flows
        // we cannot use fixtures because migration 135 overrides the opt in value to true
        await disableStxSetting(driver);

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

        // Switch back to Ethereum before starting the next bridge transaction
        // This ensures the prefilling logic doesn't interfere with test expectations
        await switchToNetworkFromSendFlow(driver, 'Ethereum');

        await bridgeTransaction(
          driver,
          {
            amount: '1',
            tokenFrom: 'ETH',
            tokenTo: 'USDC',
            fromChain: 'Ethereum',
            toChain: 'Arbitrum One',
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

        // Switch to Arbitrum One to set it as the selected network
        // in the network-controller
        await homePage.check_pageIsLoaded();
        await homePage.goToTokensTab();
        await searchAndSwitchToNetworkFromSendFlow(driver, 'Arbitrum One');
        await homePage.goToActivityList();

        // Switch back to Ethereum before starting the next bridge transaction
        // This ensures the prefilling logic doesn't interfere with test expectations
        await switchToNetworkFromSendFlow(driver, 'Ethereum');

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
});
