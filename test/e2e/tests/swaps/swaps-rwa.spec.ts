import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { bridgeTransaction } from '../../page-objects/flows/bridge.flow';
import { getBridgeFixtures } from '../bridge/bridge-test-utils';
import { DEFAULT_BRIDGE_FEATURE_FLAGS } from '../bridge/constants';

describe('Swap RWA', function () {
  const swapTestCases = [
    {
      name: 'should swap USDC to GOOGLon',
      quote: {
        amount: '25',
        tokenFrom: 'USDC',
        tokenTo: 'GOOGLon',
        fromChain: 'Ethereum',
        toChain: 'Ethereum',
        unapproved: true,
      },
      expectedTransactionsCount: 2,
      expectedDestAmount: '23.83',
    }
  ];

  swapTestCases.forEach((testCase) => {
    it(testCase.name, async function () {
      await withFixtures(
        getBridgeFixtures({
          title: this.test?.fullTitle(),
          featureFlags: DEFAULT_BRIDGE_FEATURE_FLAGS,
        }),
        async ({ driver }) => {
          await login(driver, { expectedBalance: '$225,730.11' });

          await bridgeTransaction({
            driver,
            quote: testCase.quote,
            expectedTransactionsCount: testCase.expectedTransactionsCount,
            expectedDestAmount: testCase.expectedDestAmount,
          });
        },
      );
    });
  });
});
