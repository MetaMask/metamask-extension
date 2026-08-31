import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import { bridgeTransaction } from '../../page-objects/flows/bridge.flow';
import { login } from '../../page-objects/flows/login.flow';
import { BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED } from './constants';
import { getMonadBaseBridgeFixtures } from './bridge-test-utils';

describe('Bridge Monad to Base', function (this: Suite) {
  this.timeout(120000);

  it('labels MON→USDC(Base) as Bridged with success details', async function () {
    await withFixtures(
      getMonadBaseBridgeFixtures(
        this.test?.fullTitle(),
        BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
      ),
      async ({ driver }) => {
        await login(driver, { expectedBalance: '$225,730.11' });

        await bridgeTransaction({
          driver,
          quote: {
            amount: '1',
            tokenFrom: 'MON',
            tokenTo: 'USDC',
            fromChain: 'Monad',
            toChain: 'Base',
          },
          expectedTransactionsCount: 1,
          expectedDestAmount: '1,642',
          expectedActivityAmount: '+1,642.0043',
          expectedStatus: 'success',
          // Monad gas estimation does not populate `$X.XX` in this mocked setup;
          // ticket coverage is Activity labeling + details, not prepare-page fees.
          skipNetworkFeeCheck: true,
        });
      },
    );
  });
});
