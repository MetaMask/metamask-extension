import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { bridgeTransaction } from '../../page-objects/flows/bridge.flow';
import { getBridgeFixtures } from '../bridge/bridge-test-utils';
import { BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED } from '../bridge/constants';

describe('Swap RWA - ', function () {
  const swapTestCases = [
    {
      name: 'should swap USDC to GOOGLON',
      quote: {
        amount: '25',
        tokenFrom: 'USDC',
        tokenTo: 'GOOGLON',
        fromChain: 'Ethereum',
        toChain: 'Ethereum',
        unapproved: true,
      },
      expectedTransactionsCount: 1,
      expectedDestAmount: '0.0572'
    },
    {
      name: 'should swap GOOGLON to USDC',
      quote: {
        amount: '1',
        tokenFrom: 'GOOGLON',
        tokenTo: 'USDC',
        fromChain: 'Ethereum',
        toChain: 'Ethereum',
        unapproved: true,
      },
      expectedTransactionsCount: 1,
      expectedDestAmount: '395.7'
    },
    {
      name: 'should swap GOOGLON to SPYON',
      quote: {
        amount: '1',
        tokenFrom: 'GOOGLON',
        tokenTo: 'SPYON',
        fromChain: 'Ethereum',
        toChain: 'Ethereum',
        unapproved: true,
      },
      expectedTransactionsCount: 1,
      expectedDestAmount: '0.491'
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
            expectedDestAmount: testCase.expectedDestAmount,
            skipStatusPage: true,
          });
        },
      );
    });
  });
});
