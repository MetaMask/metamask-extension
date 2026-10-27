/**
 * Non-zero / zero-sentinel native currency — Rootstock, Stable, Mantle, Metis,
 * Gnosis.
 *
 * Monitors Tokens-tab regression coverage for networks whose native token is
 * not the usual `0x0` sentinel (or is catalogued as `erc20:0x0`): a single
 * native row with the expected symbol and balance.
 *
 * See `test/e2e/helpers/custom-network-harness.ts`.
 */

import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import {
  NON_ZERO_NATIVE_NETWORKS,
  getCustomNetwork,
  prepareCustomNetwork,
} from '../../helpers/custom-network-harness';
import { login } from '../../page-objects/flows/login.flow';
import TokensTab from '../../page-objects/pages/home/tokens-tab';

NON_ZERO_NATIVE_NETWORKS.forEach((id) => {
  describe(`Non-zero native on ${getCustomNetwork(id).name}`, function () {
    it('shows a single native Tokens row with the expected balance', async function () {
      const { fixtures, localNodeOptions, testSpecificMock, network } =
        prepareCustomNetwork(id, 'nativeSend');

      await withFixtures(
        {
          fixtures,
          localNodeOptions,
          testSpecificMock,
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          // Homepage overview still shows an ETH-denominated default; the
          // Tokens tab is the surface under test.
          await login(driver, { validateBalance: false });

          const tokensTab = new TokensTab(driver);
          await tokensTab.checkTokenListIsDisplayed();
          await tokensTab.checkTokenItemNumber(1);
          await tokensTab.checkTokenExistsInList(network.nativeSymbol);
          await tokensTab.checkExpectedTokenBalanceIsDisplayed(
            '25',
            network.nativeSymbol,
          );
        },
      );
    });
  });
});
