import { Suite } from 'mocha';
import { unlockWallet, withFixtures } from '../../helpers';
import { searchAndSwitchToNetworkFromGlobalMenuFlow } from '../../page-objects/flows/network.flow';
import { disableStxSetting } from '../../page-objects/flows/toggle-stx-setting.flow';
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

        // Add Arbitrum One
        await searchAndSwitchToNetworkFromGlobalMenuFlow(
          driver,
          'Arbitrum One',
        );

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
        );

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
        );

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
        );
      },
    );
  });
});
