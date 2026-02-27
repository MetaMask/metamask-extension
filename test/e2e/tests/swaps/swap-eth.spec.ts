import { withFixtures } from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import {
  bridgeTransaction,
  getBridgeFixtures,
} from '../bridge/bridge-test-utils';
import { BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED } from '../bridge/constants';

// TODO: (MM-PENDING) These tests are planned for deprecation as part of swaps testing revamp
describe('Swap Eth for another Token', function () {
  it('Completes a Swap between ETH and MUSD', async function () {
    await withFixtures(
      getBridgeFixtures(
        this.test?.fullTitle(),
        BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
      ),
      async ({ driver }) => {
        await loginWithBalanceValidation(driver, undefined, undefined, '$0');

        await bridgeTransaction({
          driver,
          quote: {
            amount: '1',
            tokenFrom: 'ETH',
          },
          expectedTransactionsCount: 1,
          expectedSwapTokens: {
            tokenFrom: 'ETH',
            tokenTo: 'MUSD',
          },
          // The expected amount in destination token can vary as upstream quote data changes.
          expectedDestAmount: '',
        });
      },
    );
  });
});
