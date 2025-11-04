import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import GeneralSettings from '../../page-objects/pages/settings/general-settings';
import HomePage from '../../page-objects/pages/home/homepage';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Hide tokens without balance', function (this: Suite) {
  // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // This script tests the "hide tokens without balance" feature in wallet settings, ensuring that tokens with zero        //
  // balances are correctly hidden from the tokens list tab when corresponding toggle is enabled.                       //
  // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it('user can activate hide tokens without balance feature via settings', async function () {
    const smartContract = SMART_CONTRACTS.HST;
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        smartContract,
      },
      async ({ driver, localNodes }) => {
        await loginWithBalanceValidation(driver, localNodes[0]);
        const assetListPage = new AssetListPage(driver);
        await assetListPage.importCustomTokenByChain(
          '0x539',
          '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947',
        );
        await assetListPage.importCustomTokenByChain(
          '0x539',
          '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945948',
          'TST2',
          '4',
        );

        // Verify that both zero-balance tokens and non-zero-balance tokens are displayed by default
        const tokenList = new AssetListPage(driver);
        await tokenList.checkTokenItemNumber(3);
        await tokenList.checkTokenExistsInList('Ethereum');
        await tokenList.checkTokenExistsInList('TST');
        await tokenList.checkTokenExistsInList('TST2');

        // Navigate to settings and toggle on "hide tokens without balance" feature
        await new HomePage(driver).headerNavbar.openSettingsPage();
        const generalSettings = new GeneralSettings(driver);
        await generalSettings.checkPageIsLoaded();
        await generalSettings.toggleHideTokensWithoutBalance();
        await new SettingsPage(driver).closeSettingsPage();

        // Check that tokens with zero balances are hidden, tokens with non-zero balances remain visible
        await new HomePage(driver).checkPageIsLoaded();
        await tokenList.checkTokenItemNumber(2);
        await tokenList.checkTokenExistsInList('Ethereum');
        await tokenList.checkTokenExistsInList('TST');
      },
    );
  });
});
