import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { bridgeTransaction } from '../../page-objects/flows/bridge.flow';
import { getBridgeFixtures } from '../bridge/bridge-test-utils';
import { DEFAULT_BRIDGE_FEATURE_FLAGS } from '../bridge/constants';

describe('Swap', function () {
  const swapTestCases = [
    {
      name: 'should swap DAI to ETH',
      quote: {
        amount: '25',
        tokenFrom: 'DAI',
        tokenTo: 'ETH',
        fromChain: 'Ethereum',
        toChain: 'Linea',
        unapproved: true,
      },
      expectedTransactionsCount: 2,
      expectedDestAmount: '0.0157',
    },
    {
      name: 'should swap USDC to DAI',
      quote: {
        amount: '10',
        tokenFrom: 'USDC',
        tokenTo: 'DAI',
        fromChain: 'Ethereum',
        toChain: 'Linea',
        unapproved: true,
      },
      expectedTransactionsCount: 2,
      expectedDestAmount: '9.9',
    },
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
