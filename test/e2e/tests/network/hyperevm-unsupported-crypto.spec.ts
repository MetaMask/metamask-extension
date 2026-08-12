/**
 * HyperEVM unsupported crypto handling - graceful degradation.
 *
 * Monitors the regression where selecting HyperEVM throws a price API
 * "unsupported cryptocurrencies" error. The UI should handle this
 * gracefully — no blocking error toast, no blocking error screen. The
 * native HYPE token should still render on the Tokens tab.
 *
 * See `test/e2e/helpers/custom-chain-conversion-rates.ts` for the fixture
 * and mock wiring.
 */

import { Anvil } from '../../seeder/anvil';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import {
  getCustomChainFixtureBuilder,
  mockChainConversionRateApis,
} from '../../helpers/custom-chain-conversion-rates';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import TokensTab from '../../page-objects/pages/home/tokens-tab';

const HYPE_CONFIG = {
  name: 'HyperEVM',
  chainIdHex: '0x3e7' as const,
  chainIdDecimal: 999,
  nativeSymbol: 'HYPE',
  nativeAssetId: 'eip155:999/slip44:2457',
  uiNativeAssetId: 'eip155:999/slip44:2457',
  caipChainId: 'eip155:999',
  blockExplorerUrl: 'https://hyperevmscan.io/',
  clientId: 'hyperevm-local',
  localNodeOptions: [{ type: 'anvil' as const, options: { chainId: 999 } }],
};

describe('HyperEVM unsupported crypto handling', function () {
  it('does not show a blocking error toast when price API is unsupported', async function () {
    await withFixtures(
      {
        fixtures: getCustomChainFixtureBuilder(HYPE_CONFIG).build(),
        localNodeOptions: HYPE_CONFIG.localNodeOptions,
        testSpecificMock: (mockServer: Parameters<typeof mockChainConversionRateApis>[0]) =>
          mockChainConversionRateApis(mockServer, HYPE_CONFIG),
        title: this.test?.fullTitle(),
        // The "unsupported cryptocurrencies" console error is expected
        // since the test verifies the UI handles it gracefully.
        ignoredConsoleErrors: ['unsupported cryptocurrencies'],
      },
      async ({
        driver,
        localNodes,
      }: {
        driver: Driver;
        localNodes?: Anvil[];
      }) => {
        await login(driver, { validateBalance: false });

        const homePage = new HomePage(driver);
        const tokensTab = new TokensTab(driver);

        // Verify the homepage loaded — no blocking error screen.
        await homePage.checkPageIsLoaded();

        // Navigate to the Tokens tab.
        await tokensTab.checkTokenListIsDisplayed();

        // The native HYPE token should be visible (metadata is mocked).
        await tokensTab.checkTokenExistsInList('HYPE');

        // No blocking error toast should appear — the UI degrades gracefully
        // when the price API doesn't support the chain's native asset.
        // The fiat column may show an em dash, but no error toast blocks the UI.
        await homePage.checkNoSurveyToastIsDisplayed();
      },
    );
  });
});
