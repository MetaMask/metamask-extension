import { Suite } from 'mocha';
import { withFixtures, WINDOW_TITLES } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { Driver } from '../../webdriver/driver';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import TestDapp from '../../page-objects/pages/test-dapp';
import AddTokensModal from '../../page-objects/pages/dialog/add-tokens';
import ReviewPermissionsConfirmation from '../../page-objects/pages/confirmations/redesign/review-permissions-confirmation';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import { DAPP_URL } from '../../constants';
import ContractAddressRegistry from '../../seeder/contract-address-registry';
import { Anvil } from '../../seeder/anvil';

describe('Request Queue WatchAsset -> SwitchChain -> WatchAsset', function (this: Suite) {
  const smartContract = SMART_CONTRACTS.HST;
  it('should not batch subsequent watchAsset token into first watchAsset confirmation with a switchChain in the middle', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleNode()
          .withPermissionControllerConnectedToTestDapp()
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

      async ({
        driver,
        contractRegistry,
        localNodes,
      }: {
        driver: Driver;
        contractRegistry: ContractAddressRegistry;
        localNodes: Anvil[];
      }) => {
        const contractAddress =
          await contractRegistry.getContractAddress(smartContract);
        await loginWithBalanceValidation(driver, localNodes[0]);

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage({ contractAddress, url: DAPP_URL });

        // Watch Asset 1st call
        await testDapp.clickAddTokenToWallet();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Switch Ethereum Chain
        const switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x53a' }],
        });

        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );

        // Handle potential Review Permissions dialog (appears in CI but not locally)
        try {
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const reviewPermissionsConfirmation =
            new ReviewPermissionsConfirmation(driver);
          // Short timeout to check if permissions dialog exists
          await driver.waitForSelector(
            { text: 'Review permissions', tag: 'h3' },
            { timeout: 3000 },
          );
          await reviewPermissionsConfirmation.confirmReviewPermissions();
        } catch (error) {
          // Permissions dialog doesn't appear (local environment)
          console.log('No permissions dialog found, continuing...');
        }

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Watch Asset 2nd call
        await testDapp.clickAddTokenToWallet();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Wait for token to show in list of tokens to watch
        const addTokensModal = new AddTokensModal(driver);
        await addTokensModal.waitUntilXTokens(1);
      },
    );
  });
});
