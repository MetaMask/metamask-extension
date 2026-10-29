import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import BridgeQuotePage from '../../page-objects/pages/bridge/quote-page';
import { getRwaSwapGeoBlockFixtures } from '../bridge/bridge-test-utils';

const USDC_TO_GOOGLON_QUOTE = {
  amount: '25',
  tokenFrom: 'USDC',
  tokenTo: 'GOOGLON',
  fromChain: 'Ethereum',
  toChain: 'Ethereum',
  unapproved: true,
} as const;

describe('Swap RWA Geo-block', function (this: Suite) {
  this.timeout(160_000);
  it('shows geo-restricted message when swapping USDC to GOOGLON in a blocked region', async function () {
    await withFixtures(
      getRwaSwapGeoBlockFixtures(this.test?.fullTitle()),
      async ({ driver }) => {
        await login(driver, { expectedBalance: '$225,730.11' });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.startSwapFlow();

        const bridgeQuotePage = new BridgeQuotePage(driver);
        await bridgeQuotePage.enterBridgeQuote(USDC_TO_GOOGLON_QUOTE);
        await bridgeQuotePage.checkRwaGeoRestrictedMessageIsDisplayed();
      },
    );
  });
});
