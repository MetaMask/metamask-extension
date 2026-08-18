import type { CaipAssetType } from '@metamask/utils';
import { Suite } from 'mocha';
import { buildAssetRoutePath } from '../../../../shared/lib/asset-route';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import BridgeQuotePage from '../../page-objects/pages/bridge/quote-page';
import HomePage from '../../page-objects/pages/home/homepage';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import TokenOverviewPage from '../../page-objects/pages/token-overview-page';
import { getBridgeFixtures } from '../bridge/bridge-test-utils';
import { BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED } from '../bridge/constants';

const DAI_MAINNET_ASSET_ID =
  'eip155:1/erc20:0x6B175474E89094C44Da98b954EedeAC495271d0F' as CaipAssetType;

/**
 * Balance-aware Swap defaults from the Token Detail Page.
 *
 * The wallet holds ETH only, so DAI stands in for a token the user can open
 * but cannot swap from.
 */
describe('Balance-aware Swap defaults from Token Detail Page', function (this: Suite) {
  it('uses the viewed token as the source when it has a balance', async function () {
    await withFixtures(
      {
        ...getBridgeFixtures({
          title: this.test?.fullTitle(),
          featureFlags: BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
        }),
        ignoredConsoleErrors: ['getSubscriptions'],
      },
      async ({ driver }) => {
        await login(driver, { expectedBalance: '$225,730.11' });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        const tokensTab = new TokensTab(driver);
        await tokensTab.clickOnAsset('Ether');

        const tokenOverviewPage = new TokenOverviewPage(driver);
        await tokenOverviewPage.checkPageIsLoaded();
        await tokenOverviewPage.clickSwap();

        const bridgePage = new BridgeQuotePage(driver);
        await bridgePage.checkAssetsAreSelected('ETH', 'mUSD');
      },
    );
  });

  it('uses a funded token as the source and the viewed token as the destination when the balance is zero', async function () {
    await withFixtures(
      {
        ...getBridgeFixtures({
          title: this.test?.fullTitle(),
          featureFlags: BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
        }),
        ignoredConsoleErrors: ['getSubscriptions'],
      },
      async ({ driver }) => {
        await login(driver, { expectedBalance: '$225,730.11' });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        // DAI is not held, so it is only reachable by opening its page directly.
        await driver.openNewURL(
          `${driver.extensionUrl}/home.html#${buildAssetRoutePath(
            DAI_MAINNET_ASSET_ID,
          )}`,
        );

        const tokenOverviewPage = new TokenOverviewPage(driver);
        await tokenOverviewPage.checkPageIsLoaded();
        await tokenOverviewPage.clickSwap();

        // Without balance-aware defaults, DAI would open as the source and
        // leave Swap unusable until the user changed tokens.
        const bridgePage = new BridgeQuotePage(driver);
        await bridgePage.checkAssetsAreSelected('ETH', 'DAI');
      },
    );
  });
});
