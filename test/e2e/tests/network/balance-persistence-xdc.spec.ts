/**
 * Balance persistence on XDC Network - switch to Mainnet and back.
 *
 * Monitors the regression where balances on custom/featured networks flicker
 * or fail to stick after switching to Ethereum Mainnet and back. The fixture
 * enables both XDC and Mainnet, seeds balances for both, and the spec
 * verifies that XDC native + ERC-20 balances are still displayed after a
 * round-trip network switch.
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
import NetworkFilter from '../../page-objects/pages/networks/network-filter';
import SelectNetworkModal, {
  NetworkId,
} from '../../page-objects/pages/networks/select-network-modal';

describe('Balance persistence on XDC Network', function () {
  it('retains XDC balances after switching to Mainnet and back', async function () {
    const { fixtures, localNodeOptions, testSpecificMock, network } =
      prepareCustomNetwork('xdc', 'dualNetworkWithErc20');

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
        // Login without balance validation — the overview shows "ETH" by
        // default but the selected network is XDC, so the default check
        // would look for "25 ETH" and fail. The Tokens tab is verified below.
        await login(driver, { validateBalance: false });

        const tokensTab = new TokensTab(driver);
        const networkFilter = new NetworkFilter(driver);
        const selectNetworkModal = new SelectNetworkModal(driver);

        await tokensTab.checkTokenListIsDisplayed();
        await tokensTab.checkTokenExistsInList(network.nativeSymbol);
        await tokensTab.checkTokenExistsInList(SEEDED_ERC20_SYMBOL);
        await tokensTab.checkExpectedTokenBalanceIsDisplayed(
          '10',
          SEEDED_ERC20_SYMBOL,
        );

        // selectNetworkByChainId auto-closes the dropdown, so no
        // close() call is needed after selecting.
        await networkFilter.open();
        await selectNetworkModal.checkPageIsLoaded();
        await selectNetworkModal.selectNetworkByChainId(NetworkId.ETHEREUM);

        // The native token may display as "Ethereum" (name) rather than "ETH"
        // (symbol) depending on the assetsInfo metadata, so check for both.
        await tokensTab.checkTokenExistsInList('Ethereum');
        await tokensTab.checkAssetIsAbsent(network.nativeSymbol);

        await networkFilter.open();
        await selectNetworkModal.checkPageIsLoaded();
        await selectNetworkModal.selectNetworkByChainId(NetworkId.XDC);

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
