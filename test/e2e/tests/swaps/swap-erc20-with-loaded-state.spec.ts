import { withFixtures } from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import BridgeQuotePage from '../../page-objects/pages/bridge/quote-page';
import { getBridgeFixtures } from '../bridge/bridge-test-utils';

describe('Swap', function () {
  const swapTestCases = [
    {
      name: 'should swap DAI to ETH',
      quote: {
        amount: '1',
        tokenFrom: 'DAI',
        tokenTo: 'ETH',
      },
    },
    {
      name: 'should swap USDC to DAI',
      quote: {
        amount: '1',
        tokenFrom: 'USDC',
        tokenTo: 'DAI',
      },
    },
  ];

  swapTestCases.forEach((testCase) => {
    it(testCase.name, async function () {
      await withFixtures(
        getBridgeFixtures(this.test?.fullTitle()),
        async ({ driver }) => {
          await loginWithBalanceValidation(driver, undefined, undefined, '$0');

          const homePage = new HomePage(driver);
          await homePage.startSwapFlow();

          const bridgeQuotePage = new BridgeQuotePage(driver);
          await bridgeQuotePage.enterBridgeQuote(testCase.quote);
          await bridgeQuotePage.waitForQuote();
          await bridgeQuotePage.checkExpectedNetworkFeeIsDisplayed();
        },
      );
    });
  });
});
