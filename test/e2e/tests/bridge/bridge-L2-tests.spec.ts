import { Suite } from 'mocha';
import { unlockWallet, withFixtures } from '../../helpers';
import HomePage from '../../page-objects/pages/home/homepage';
import {
  searchAndSwitchToNetworkFromGlobalMenuFlow,
  switchToNetworkFromSendFlow,
} from '../../page-objects/flows/network.flow';
import { disableStxSetting } from '../../page-objects/flows/toggle-stx-setting.flow';
import NetworkManager from '../../page-objects/pages/network-manager';
import { DEFAULT_BRIDGE_FEATURE_FLAGS } from './constants';
import { bridgeTransaction, getBridgeL2Fixtures } from './bridge-test-utils';

describe('Bridge tests', function (this: Suite) {
  this.timeout(120000); // Needs a higher timeout as it's a longer tests
  it('should execute bridge transactions on L2 networks', async function () {
    await withFixtures(
      getBridgeL2Fixtures(this.test?.fullTitle(), DEFAULT_BRIDGE_FEATURE_FLAGS),
      async ({ driver }) => {
        await unlockWallet(driver);

        // disable smart transactions step by step for all bridge flows
        // we cannot use fixtures because migration 135 overrides the opt in value to true
        await disableStxSetting(driver);

        const homePage = new HomePage(driver);

        // Add Arbitrum One
        await searchAndSwitchToNetworkFromGlobalMenuFlow(
          driver,
          'Arbitrum One',
        );

        // Check only linea mainnet so balances are shown in ETH not USD (from multiple networks)
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectAllNetworks();
        await networkManager.deselectNetwork('eip155:1'); // Deselect Ethereum
        await networkManager.deselectNetwork('eip155:8453'); // Deselect Base
        await networkManager.deselectNetwork('eip155:42161'); // Deselect Arbitrum
        await networkManager.closeNetworkManager();

        await homePage.check_expectedBalanceIsDisplayed();

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
          '22.9999',
        );

        // Switch to Ethereum to set it as the current network
        await switchToNetworkFromSendFlow(driver, 'Ethereum');

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
          '22.9998',
        );

        // Switch to Arbitrum One to set it as the current network
        await switchToNetworkFromSendFlow(driver, 'Arbitrum One');

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
          '22.9997',
        );
      },
    );
  });
});
