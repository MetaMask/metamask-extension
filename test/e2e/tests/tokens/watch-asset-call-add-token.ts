import {
  defaultGanacheOptions,
  withFixtures,
  WINDOW_TITLES,
} from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import AddTokenConfirmation from '../../page-objects/pages/confirmations/redesign/add-token-confirmations';
import HomePage from '../../page-objects/pages/homepage';
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
        ganacheOptions: defaultGanacheOptions,
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver, ganacheServer, contractRegistry }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await loginWithBalanceValidation(driver, ganacheServer);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();

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
        await addTokenConfirmation.check_pageIsLoaded();
        await addTokenConfirmation.confirmAddToken();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await new HomePage(driver).check_tokenAmountIsDisplayed('0 TST');
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
        ganacheOptions: defaultGanacheOptions,
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver, ganacheServer, contractRegistry }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await loginWithBalanceValidation(driver, ganacheServer);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();

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
        await addTokenConfirmation.check_pageIsLoaded();
        await addTokenConfirmation.rejectAddToken();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await new HomePage(driver).check_tokenItemNumber(1);
      },
    );
  });
});
