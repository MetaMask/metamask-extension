/**
 * Conversion rates on custom networks - Injective, Chiliz, Plasma, Rootstock,
 * HyperEVM.
 *
 * Verifies the regression where fiat secondary values on the Tokens tab show an
 * em dash (`—`) for custom networks: the default `tokens.api.cx.metamask.io/v3/assets`
 * mock returns empty for unknown chains (so the native asset has no metadata
 * and cannot render), and the default `price.api.cx.metamask.io/v3/spot-prices`
 * mock only covers mainnet and localhost (so no price data arrives). When both
 * mocks are supplied, the fiat secondary value appears.
 *
 * See `test/e2e/helpers/custom-network-harness.ts`.
 */

import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import {
  CONVERSION_RATE_NETWORKS,
  getCustomNetwork,
  prepareCustomNetwork,
} from '../../helpers/custom-network-harness';

CONVERSION_RATE_NETWORKS.forEach((id) => {
  describe(`Conversion rates on ${getCustomNetwork(id).name}`, function (this: Suite) {
    it('shows a fiat secondary value for the native token on the Tokens tab', async function () {
      const { fixtures, localNodeOptions, testSpecificMock, network } =
        prepareCustomNetwork(id, 'conversionRate');

      await withFixtures(
        {
          fixtures,
          localNodeOptions,
          testSpecificMock,
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          // Login without balance validation — the homepage overview shows
          // "25 ETH" by default, but these chains have different native
          // symbols. The Tokens tab is verified below instead.
          await login(driver, { validateBalance: false });

          const tokensTab = new TokensTab(driver);

          await tokensTab.checkTokenListIsDisplayed();
          await tokensTab.checkTokenExistsInList(network.name);

          // The fiat secondary value must be present (not an em dash). This is
          // the regression assertion: without the spot-prices mock the cell
          // renders the `—` placeholder and the test fails.
          await tokensTab.checkConversionRateDisplayed();
        },
      );
    });
  });
});
