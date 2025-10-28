import { Suite } from 'mocha';
import { unlockWallet, withFixtures } from '../../helpers';
import { DEFAULT_BRIDGE_FEATURE_FLAGS } from './constants';
import { bridgeTransaction, getBridgeL2Fixtures } from './bridge-test-utils';

describe('Bridge tests', function (this: Suite) {
  this.timeout(120000); // Needs a higher timeout as it's a longer tests
  it('should execute bridge transactions on L2 networks', async function () {
    await withFixtures(
      getBridgeL2Fixtures(this.test?.fullTitle(), DEFAULT_BRIDGE_FEATURE_FLAGS),
      async ({ driver }) => {
        await unlockWallet(driver);

        await bridgeTransaction({
          driver,
          quote: {
            amount: '1',
            tokenFrom: 'ETH',
            tokenTo: 'ETH',
            fromChain: 'Linea',
            toChain: 'Ethereum',
          },
          expectedTransactionsCount: 1,
          expectedDestAmount: '0.991',
        });

        await bridgeTransaction({
          driver,
          quote: {
            amount: '1',
            tokenFrom: 'ETH',
            tokenTo: 'ETH',
            fromChain: 'Linea',
            toChain: 'Arbitrum',
          },
          expectedTransactionsCount: 2,
          expectedDestAmount: '0.991',
        });

        await bridgeTransaction({
          driver,
          quote: {
            amount: '10',
            tokenFrom: 'DAI',
            tokenTo: 'DAI',
            fromChain: 'Linea',
            toChain: 'Arbitrum',
          },
          expectedTransactionsCount: 4,
          expectedDestAmount: '9.905',
        });

        await bridgeTransaction({
          driver,
          quote: {
            amount: '10',
            tokenFrom: 'DAI',
            tokenTo: 'DAI',
            fromChain: 'Linea',
            toChain: 'Ethereum',
          },
          expectedTransactionsCount: 6,
          expectedDestAmount: '9.67',
        });
      },
    );
  });
});
