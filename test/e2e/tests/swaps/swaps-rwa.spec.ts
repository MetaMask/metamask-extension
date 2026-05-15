import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { bridgeTransaction } from '../../page-objects/flows/bridge.flow';
import { getBridgeFixtures } from '../bridge/bridge-test-utils';
import { BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED } from '../bridge/constants';

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
    },
    {
      name: 'should swap GOOGLon to USDC',
      quote: {
        amount: '1',
        tokenFrom: 'GOOGLon',
        tokenTo: 'USDC',
        fromChain: 'Ethereum',
        toChain: 'Ethereum',
        unapproved: true,
      },
      expectedTransactionsCount: 2,
    },
    {
      name: 'should swap GOOGLon to SPYon',
      quote: {
        amount: '0.05',
        tokenFrom: 'GOOGLon',
        tokenTo: 'SPYon',
        fromChain: 'Ethereum',
        toChain: 'Ethereum',
        unapproved: true,
      },
      expectedTransactionsCount: 2,
    },
  ];

  swapTestCases.forEach((testCase) => {
    it(testCase.name, async function () {
      await withFixtures(
        getBridgeFixtures({
          title: this.test?.fullTitle(),
          featureFlags: BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
        }),
        async ({ driver }) => {
          await login(driver, { expectedBalance: '$225,730.11' });

          await bridgeTransaction({
            driver,
            quote: testCase.quote,
            expectedTransactionsCount: testCase.expectedTransactionsCount,
            expectedDestAmount: ''
          });
        },
      );
    });
  });
});
