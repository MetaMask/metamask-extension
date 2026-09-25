/**
 * Conversion rates on a custom network (representative E2E).
 *
 * Verifies the regression where fiat secondary values on the Tokens tab show an
 * em dash (`—`) for custom networks: the default `tokens.api.cx.metamask.io/v3/assets`
 * mock returns empty for unknown chains (so the native asset has no metadata
 * and cannot render), and the default `price.api.cx.metamask.io/v3/spot-prices`
 * mock only covers mainnet and localhost (so no price data arrives). When both
 * mocks are supplied, the fiat secondary value appears.
 *
 * Per-network data (asset ids, symbols, fixture seeding) is covered by the
 * table-driven unit tests in `custom-network-harness.test.ts`. This E2E only
 * exercises the shared Tokens-tab behavior once.
 *
 * See `test/e2e/helpers/custom-network-harness.ts`.
 */

import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import { prepareCustomNetwork } from '../../helpers/custom-network-harness';

describe('Conversion rates on custom networks', function (this: Suite) {
  it('shows a fiat secondary value for the native token on the Tokens tab', async function () {
    // Injective is the representative case: UI native slip44 differs from the
    // NetworkEnablementController native asset id, so both catalog ids must
    // resolve for the fiat secondary value to render.
    const { fixtures, localNodeOptions, testSpecificMock, network } =
      prepareCustomNetwork('injective', 'conversionRate');

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
        // EVM natives render the ticker in the title cell, not the network name.
        await tokensTab.checkTokenExistsInList(network.nativeSymbol);
        await tokensTab.checkTokenFiatAmountIsDisplayed('$');

        // The fiat secondary value must be present (not an em dash). This is
        // the regression assertion: without the spot-prices mock the cell
        // renders the `—` placeholder and the test fails.
        await tokensTab.checkConversionRateDisplayed();
      },
    );
  });
});
