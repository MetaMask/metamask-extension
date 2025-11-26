import AddTokensModal from '../../page-objects/pages/dialog/add-tokens';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import TestDapp from '../../page-objects/pages/test-dapp';
import { withFixtures, WINDOW_TITLES } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';

describe('Multiple ERC20 Watch Asset', function () {
  it('should show multiple erc20 watchAsset token list, only confirms one bug', async function () {
    const tokenContract = SMART_CONTRACTS.HST;
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        smartContract: [tokenContract, tokenContract, tokenContract],
        title: this.test?.fullTitle(),
      },
      async ({ driver, localNodes, contractRegistry }) => {
        await loginWithBalanceValidation(driver, localNodes[0]);
        const contracts = contractRegistry.getAllDeployedContractAddresses();

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        // Watch all 3 tokens
        for (let i = 0; i < 3; i++) {
          await driver.executeScript(`
            window.ethereum.request({
              method: 'wallet_watchAsset',
              params: {
                type: 'ERC20',
                options: {
                  address: '${contracts[i]}',
                  symbol: 'TST',
                  decimals: 4
                },
              }
            })
          `);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        }

        // Switch to watchAsset notification
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
        await tokenList.checkTokenExistsInList('Ether');
        await tokenList.checkTokenExistsInList('TST');
      },
    );
  });
});
