/**
 * Balance persistence on XDC Network - switch to Mainnet and back.
 *
 * Monitors the regression where balances on custom/featured networks flicker
 * or fail to stick after switching to Ethereum Mainnet and back. The fixture
 * enables both XDC and Mainnet, seeds balances for both, and the spec
 * verifies that XDC native + ERC-20 balances are still displayed after a
 * round-trip network switch.
 *
 * See `test/e2e/helpers/xdc-chain.ts` for the fixture and mock wiring.
 */

import { Anvil } from '../../seeder/anvil';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import {
  XDC_LOCAL_NODE_OPTIONS,
  getXdcAndMainnetFixtureBuilderWithErc20,
  mockXdcAndMainnetApis,
} from '../../helpers/xdc-chain';
import { login } from '../../page-objects/flows/login.flow';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import NetworkFilter from '../../page-objects/pages/networks/network-filter';
import SelectNetworkModal, {
  NetworkId,
} from '../../page-objects/pages/networks/select-network-modal';

describe('Balance persistence on XDC Network', function () {
  it('retains XDC balances after switching to Mainnet and back', async function () {
    await withFixtures(
      {
        fixtures: getXdcAndMainnetFixtureBuilderWithErc20().build(),
        localNodeOptions: XDC_LOCAL_NODE_OPTIONS,
        testSpecificMock: mockXdcAndMainnetApis,
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

        // Step 1: On XDC — verify native + ERC-20 visible
        await tokensTab.checkTokenListIsDisplayed();
        await tokensTab.checkTokenExistsInList('XDC');
        await tokensTab.checkTokenExistsInList('TST');
        await tokensTab.checkExpectedTokenBalanceIsDisplayed('10', 'TST');

        // Step 2: Switch to Ethereum Mainnet.
        // selectNetworkByChainId auto-closes the dropdown, so no
        // close() call is needed after selecting.
        await networkFilter.open();
        await selectNetworkModal.checkPageIsLoaded();
        await selectNetworkModal.selectNetworkByChainId(NetworkId.ETHEREUM);

        // Verify Mainnet native token is visible and XDC is absent.
        // The native token may display as "Ethereum" (name) rather than "ETH"
        // (symbol) depending on the assetsInfo metadata, so check for both.
        await tokensTab.checkTokenExistsInList('Ethereum');
        await tokensTab.checkAssetIsAbsent('XDC');

        // Step 3: Switch back to XDC
        await networkFilter.open();
        await selectNetworkModal.checkPageIsLoaded();
        await selectNetworkModal.selectNetworkByChainId(NetworkId.XDC);

        // Step 4: Verify XDC balances persisted — did not flicker or reset
        await tokensTab.checkTokenExistsInList('XDC');
        await tokensTab.checkTokenExistsInList('TST');
        await tokensTab.checkExpectedTokenBalanceIsDisplayed('10', 'TST');
      },
    );
  });
});
