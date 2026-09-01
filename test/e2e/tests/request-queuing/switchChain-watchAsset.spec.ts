import { Suite } from 'mocha';
import {
  DAPP_URL,
  SECOND_NODE_NETWORK_CLIENT_ID,
  WINDOW_TITLES,
} from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import { login } from '../../page-objects/flows/login.flow';
import ReviewPermissionsConfirmation from '../../page-objects/pages/confirmations/review-permissions-confirmation';
import TestDapp from '../../page-objects/pages/test-dapp';

describe('Request Queue SwitchChain -> WatchAsset', function (this: Suite) {
  const smartContract = SMART_CONTRACTS.HST;
  it('should not clear subsequent watchAsset after switching chain', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withNetworkControllerDoubleNode()
          // Seed the dapp's connection to chain 1338 only
          .withPermissionControllerConnectedToTestDapp({ chainIds: [1338] })
          .withSelectedNetworkController({
            domains: { [DAPP_URL]: SECOND_NODE_NETWORK_CLIENT_ID },
          })
          .build(),
        localNodeOptions: [
          {
            type: 'anvil',
          },
          {
            type: 'anvil',
            options: {
              port,
              chainId,
            },
          },
        ],
        smartContract,
        title: this.test?.fullTitle(),
      },

      async ({ driver, contractRegistry, localNodes }) => {
        const contractAddress =
          await contractRegistry.getContractAddress(smartContract);
        await login(driver, { localNode: localNodes[0] });

        // The dapp is seeded with a connection to Localhost 8546
        // (chain 1338) only, so no live connect is needed
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage({ contractAddress, url: DAPP_URL });
        await testDapp.checkPageIsLoaded();

        // Switch Ethereum Chain
        const switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x539' }],
        });

        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const reviewPermissionsConfirmation = new ReviewPermissionsConfirmation(
          driver,
        );
        await reviewPermissionsConfirmation.checkUseEnabledNetworksMessageIsDisplayed();

        // Switch back to test dapp
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.checkPageIsLoaded();

        // Watch Asset
        await testDapp.clickAddTokenToWallet();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Confirm Switch Network
        await reviewPermissionsConfirmation.checkPageIsLoaded();
        await reviewPermissionsConfirmation.clickConfirmReviewPermissionsButton();

        await driver.waitUntilXWindowHandles(3);
      },
    );
  });
});
