import AddTokensModal from '../../page-objects/pages/dialog/add-tokens';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import TestDapp from '../../page-objects/pages/test-dapp';
import {
  withFixtures,
  openDapp,
  WINDOW_TITLES,
  DAPP_URL,
  unlockWallet,
} from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import CreateContractModal from '../../page-objects/pages/dialog/create-contract';

describe('Multiple ERC20 Watch Asset', function () {
  it('should show multiple erc20 watchAsset token list, only confirms one bug', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await openDapp(driver, undefined, DAPP_URL);
        const testDapp = new TestDapp(driver);

        // Create multiple tokens
        for (let i = 0; i < 3; i++) {
          // Create token
          await testDapp.findAndClickCreateToken();

          // Confirm token creation
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const createContractModal = new CreateContractModal(driver);
          await createContractModal.checkPageIsLoaded();
          await createContractModal.clickConfirm();

          // Wait for token address to populate in dapp
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          await testDapp.checkPageIsLoaded();
          await testDapp.checkTokenAddressesCount(i + 1);
        }

        // Watch all 3 tokens
        // Switch to watchAsset notification
        await testDapp.clickAddTokenToWallet();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const addTokensPopupModal = new AddTokensModal(driver);
        await addTokensPopupModal.checkPageIsLoaded();
        await addTokensPopupModal.waitUntilXTokens(3);
        await addTokensPopupModal.confirmAddTokens();

        // Switch to fullscreen extension
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Check all three tokens have been added to the token list.
        const tokenList = new AssetListPage(driver);
        await tokenList.checkTokenItemNumber(4); // 3 tokens plus ETH
        await tokenList.checkTokenExistsInList('Ethereum');
        await tokenList.checkTokenExistsInList('TST');
      },
    );
  });
});
