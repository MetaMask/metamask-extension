import { withFixtures, WINDOW_TITLES } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import AddTokenConfirmation from '../../page-objects/pages/confirmations/redesign/add-token-confirmations';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import TestDapp from '../../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Add token using wallet_watchAsset', function () {
  const smartContract = SMART_CONTRACTS.HST;

  it('opens a notification that adds a token when wallet_watchAsset is executed, then approves', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver, localNodes, contractRegistry }) => {
        const contractAddress =
          await contractRegistry.getContractAddress(smartContract);
        await loginWithBalanceValidation(driver, localNodes[0]);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        await driver.executeScript(`
          window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
              type: 'ERC20',
              options: {
                address: '${contractAddress}',
                symbol: 'TST',
                decimals: 4
              },
            }
          })
        `);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const addTokenConfirmation = new AddTokenConfirmation(driver);
        await addTokenConfirmation.checkPageIsLoaded();
        await addTokenConfirmation.confirmAddToken();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await new AssetListPage(driver).checkTokenAmountIsDisplayed('0 TST');
      },
    );
  });

  it('opens a notification that adds a token when wallet_watchAsset is executed, then rejects', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver, localNodes, contractRegistry }) => {
        const contractAddress =
          await contractRegistry.getContractAddress(smartContract);
        await loginWithBalanceValidation(driver, localNodes[0]);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        await driver.executeScript(`
          window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
              type: 'ERC20',
              options: {
                address: '${contractAddress}',
                symbol: 'TST',
                decimals: 4
              },
            }
          })
        `);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const addTokenConfirmation = new AddTokenConfirmation(driver);
        await addTokenConfirmation.checkPageIsLoaded();
        await addTokenConfirmation.rejectAddToken();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await new AssetListPage(driver).checkTokenItemNumber(1);
      },
    );
  });
});
