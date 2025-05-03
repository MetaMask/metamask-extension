import { Suite } from 'mocha';
import { unlockWallet, withFixtures } from '../../helpers';
import HomePage from '../../page-objects/pages/home/homepage';
import {
  switchToNetworkFlow,
  searchAndSwitchToNetworkFlow,
} from '../../page-objects/flows/network.flow';
import { Driver } from '../../webdriver/driver';
import BridgeQuotePage, {
  BridgeQuote,
} from '../../page-objects/pages/bridge/quote-page';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { getBridgeL2Fixtures } from './bridge-test-utils';
import { DEFAULT_BRIDGE_FEATURE_FLAGS } from './constants';
import { getBridgeL2Fixtures, bridgeTransaction } from './bridge-test-utils';
import { DEFAULT_FEATURE_FLAGS_RESPONSE } from './constants';

describe('Bridge tests', function (this: Suite) {
  it('should execete bridge transactions on L2 networks', async function () {
    await withFixtures(
      getBridgeL2Fixtures(this.test?.fullTitle(), {
        ...DEFAULT_BRIDGE_FEATURE_FLAGS.bridgeConfig,
        support: true,
      }),
      async ({ driver }) => {
        await unlockWallet(driver);
        const homePage = new HomePage(driver);
        await homePage.check_expectedBalanceIsDisplayed();

        // Add Arbitrum One and make it the current network
        await searchAndSwitchToNetworkFlow(driver, 'Arbitrum One');

        await bridgeTransaction(
          driver,
          {
            amount: '1',
            tokenFrom: 'ETH',
            tokenTo: 'ETH',
            fromChain: 'Linea',
            toChain: 'Ethereum',
          },
          1,
          '$0.00',
          '23.9999',
        );

        await bridgeTransaction(
          driver,
          {
            amount: '1',
            tokenFrom: 'ETH',
            tokenTo: 'ETH',
            fromChain: 'Linea',
            toChain: 'Arbitrum One',
          },
          2,
          '$0.00',
          '22.9999',
        );

        // Switch to Ethereum to set it as the current network
        await switchToNetworkFlow(driver, 'Ethereum Mainnet');

        await bridgeTransaction(
          driver,
          {
            amount: '10',
            tokenFrom: 'DAI',
            tokenTo: 'DAI',
            fromChain: 'Linea',
            toChain: 'Arbitrum One',
          },
          4,
          '$0.00',
          '22.9998',
        );

        // Switch to Arbitrum One to set it as the current network
        await switchToNetworkFlow(driver, 'Arbitrum One');

        await bridgeTransaction(
          driver,
          {
            amount: '10',
            tokenFrom: 'DAI',
            tokenTo: 'DAI',
            fromChain: 'Linea',
            toChain: 'Ethereum',
          },
          6,
          '$0.00',
          '22.9997',
        );
      },
    );
  });
});
