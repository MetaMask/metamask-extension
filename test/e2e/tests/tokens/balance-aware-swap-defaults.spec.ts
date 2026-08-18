import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import { goToAssetPage } from '../../page-objects/flows/bridge.flow';
import { login } from '../../page-objects/flows/login.flow';
import BridgeQuotePage from '../../page-objects/pages/bridge/quote-page';
import HomePage from '../../page-objects/pages/home/homepage';
import TokenOverviewPage from '../../page-objects/pages/token-overview-page';
import { getBridgeFixtures } from '../bridge/bridge-test-utils';
import { BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED } from '../bridge/constants';

/**
 * Balance-aware Swap defaults from the Token Detail Page (ASSETS-3700).
 *
 * When the viewed token has a balance, it is pre-selected as the Swap source.
 * When it has no balance, a funded same-chain (or fallback) token is used as
 * source and the viewed token is pre-selected as the destination so Swap opens
 * in an actionable state.
 */
describe('Balance-aware Swap defaults from Token Detail Page', function (this: Suite) {
  this.timeout(120000);

  it('uses the viewed token as from when it has a balance', async function () {
    await withFixtures(
      getBridgeFixtures({
        title: this.test?.fullTitle(),
        featureFlags: BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
      }),
      async ({ driver }) => {
        await login(driver, { expectedBalance: '$225,730.11' });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.startSwapFlow();

        const bridgePage = new BridgeQuotePage(driver);
        await bridgePage.checkPageIsLoaded();

        // DAI is seeded with a positive balance in bridge fixtures.
        await goToAssetPage({
          driver,
          token: 'DAI',
          chainId: '0x1',
          address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        });

        const tokenOverviewPage = new TokenOverviewPage(driver);
        await tokenOverviewPage.clickSwap();

        await bridgePage.checkAssetsAreSelected('DAI', 'mUSD');
      },
    );
  });

  it('uses a funded token as from and the viewed token as to when balance is zero', async function () {
    await withFixtures(
      getBridgeFixtures({
        title: this.test?.fullTitle(),
        featureFlags: BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
      }),
      async ({ driver }) => {
        await login(driver, { expectedBalance: '$225,730.11' });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.startSwapFlow();

        const bridgePage = new BridgeQuotePage(driver);
        await bridgePage.checkPageIsLoaded();

        // Linea USDC is searchable but not held in bridge fixtures (0 balance).
        // Same-chain funded native ETH should become the Swap source.
        await goToAssetPage({
          driver,
          token: 'USDC',
          chainId: '0xe708',
          address: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff',
        });

        const tokenOverviewPage = new TokenOverviewPage(driver);
        await tokenOverviewPage.clickSwap();

        await bridgePage.checkAssetsAreSelected('ETH', 'USDC');
      },
    );
  });
});
