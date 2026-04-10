import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import { bridgeTransaction } from '../../page-objects/flows/bridge.flow';
import { login } from '../../page-objects/flows/login.flow';
import { BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED } from './constants';
import { getBridgeL2Fixtures } from './bridge-test-utils';

describe('Bridge tests', function (this: Suite) {
  this.timeout(120000); // Needs a higher timeout as it's a longer tests
  it('should execute bridge transactions on L2 networks', async function () {
    await withFixtures(
      getBridgeL2Fixtures(
        this.test?.fullTitle(),
        BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
      ),
      async ({ driver }) => {
        await login(driver, { expectedBalance: '$225,730.11' });

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
          dismissStatusPage: true,
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
          dismissStatusPage: true,
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
          dismissStatusPage: true,
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
          dismissStatusPage: true,
        });
      },
    );
  });
});
