/**
 * Token visibility on XDC Network - native + ERC-20.
 *
 * Monitors the regression where tokens fail to render on custom/featured
 * networks because the default `tokens.api.cx.metamask.io/v3/assets` mock only
 * knows mainnet/localhost and returns an empty array for everything else.
 * Without name/symbol/decimals the UI cannot render the asset, so it shows a
 * zero balance and no list entry.
 *
 * See `test/e2e/helpers/custom-network-harness.ts`.
 */

import { Anvil } from '../../seeder/anvil';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import {
  SEEDED_ERC20_SYMBOL,
  prepareCustomNetwork,
} from '../../helpers/custom-network-harness';
import { login } from '../../page-objects/flows/login.flow';
import TokensTab from '../../page-objects/pages/home/tokens-tab';

describe('Token visibility on XDC Network', function () {
  it('shows native XDC and ERC-20 tokens on the Tokens tab', async function () {
    const { fixtures, localNodeOptions, testSpecificMock, network } =
      prepareCustomNetwork('xdc', 'nativeAndErc20');

    await withFixtures(
      {
        fixtures,
        localNodeOptions,
        testSpecificMock,
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        localNodes,
      }: {
        driver: Driver;
        localNodes?: Anvil[];
      }) => {
        await login(driver, { localNode: localNodes?.[0] });

        const tokensTab = new TokensTab(driver);
        await tokensTab.checkTokenListIsDisplayed();

        // Native XDC must render — this is the regression: without metadata
        // mocks it shows 0 and no list entry.
        await tokensTab.checkTokenExistsInList(network.nativeSymbol);

        await tokensTab.checkTokenExistsInList(SEEDED_ERC20_SYMBOL);
        await tokensTab.checkExpectedTokenBalanceIsDisplayed(
          '10',
          SEEDED_ERC20_SYMBOL,
        );
      },
    );
  });
});
