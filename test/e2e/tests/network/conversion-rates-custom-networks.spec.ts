/**
 * Conversion rates on custom networks - Injective, Chiliz, Plasma, Rootstock.
 *
 * Verifies the regression where fiat secondary values on the Tokens tab show an
 * em dash (`—`) for custom networks: the default `tokens.api.cx.metamask.io/v3/assets`
 * mock returns empty for unknown chains (so the native asset has no metadata
 * and cannot render), and the default `price.api.cx.metamask.io/v3/spot-prices`
 * mock only covers mainnet and localhost (so no price data arrives). When both
 * mocks are supplied, the fiat secondary value appears.
 *
 * One parameterized spec loops over the four chains, sharing a generic fixture
 * builder and a single-handler mock function. See
 * `test/e2e/helpers/custom-chain-conversion-rates.ts` for the wiring.
 */

import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { Anvil } from '../../seeder/anvil';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import {
  CHAIN_CONFIGS,
  getCustomChainFixtureBuilder,
  mockChainConversionRateApis,
} from '../../helpers/custom-chain-conversion-rates';

CHAIN_CONFIGS.forEach((config) => {
  describe(`Conversion rates on ${config.name}`, function (this: Suite) {
    it('shows a fiat secondary value for the native token on the Tokens tab', async function () {
      await withFixtures(
        {
          fixtures: getCustomChainFixtureBuilder(config).build(),
          localNodeOptions: config.localNodeOptions,
          testSpecificMock: (mockServer: Mockttp) =>
            mockChainConversionRateApis(mockServer, config),
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver; localNodes?: Anvil[] }) => {
          // Login without balance validation — the homepage overview shows
          // "25 ETH" by default, but these chains have different native
          // symbols. The Tokens tab is verified below instead.
          await login(driver, { validateBalance: false });

          const tokensTab = new TokensTab(driver);

          // The token list must render with the native asset present. The
          // token-name cell displays the native currency symbol (e.g. `INJ`),
          // and waitForSelector's text match is substring-based, so matching
          // on config.nativeSymbol is reliable across all four chains.
          await tokensTab.checkTokenListIsDisplayed();
          await tokensTab.checkTokenExistsInList(config.nativeSymbol);

          // The fiat secondary value must be present (not an em dash). This is
          // the regression assertion: without the spot-prices mock the cell
          // renders the `—` placeholder and the test fails.
          await tokensTab.checkConversionRateDisplayed();
        },
      );
    });
  });
});
