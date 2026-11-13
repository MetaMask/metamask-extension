import { withFixtures } from '../../helpers';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../constants';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import CustomTokenImportPage from '../../page-objects/pages/token-management/custom-token-import-page';
import TokenManagementPage from '../../page-objects/pages/token-management/token-management-page';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import {
  deployErc20AtMainnetListedAddress,
  MAINNET_LISTED_TOKEN_ADDRESS,
  MAINNET_LISTED_TOKEN_MINTED_AMOUNT,
  MAINNET_LISTED_TOKEN_SYMBOL,
} from './mainnet-listed-token.helpers';

describe('Import a Mainnet-listed token address on a non-Mainnet network', function () {
  it('shows the mainnet warning, keeps the import enabled, and adds the token', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver, localNodes }) => {
        // Put a real DAI ERC-20 at the Mainnet DAI address on the local chain
        // (0x539), mirroring fork chains like PulseChain where every Mainnet
        // token lives at its Mainnet address.
        await deployErc20AtMainnetListedAddress(
          localNodes[0],
          DEFAULT_FIXTURE_ACCOUNT,
        );

        // The deployment spends gas from the Anvil account the wallet uses,
        // so its native balance no longer matches the fixture's.
        await login(driver, { validateBalance: false });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        const tokensTab = new TokensTab(driver);
        await tokensTab.clickTokenOptionsButton();
        await tokensTab.clickManageTokens();

        const tokenManagementPage = new TokenManagementPage(driver);
        await tokenManagementPage.checkPageIsLoaded();
        await tokenManagementPage.clickAddCustomToken();

        const customTokenImportPage = new CustomTokenImportPage(driver);
        await customTokenImportPage.checkPageIsLoaded();
        await customTokenImportPage.enterTokenAddress(
          MAINNET_LISTED_TOKEN_ADDRESS,
        );

        await customTokenImportPage.checkMainnetAddressWarningIsDisplayed();
        await customTokenImportPage.checkImportButtonIsEnabled();

        await customTokenImportPage.submitTokenImport();

        await tokenManagementPage.checkPageIsLoaded();
        await tokenManagementPage.checkSuccessToastIsDisplayed();
        await tokenManagementPage.goBackToHomepage();

        await homePage.checkPageIsLoaded();
        await tokensTab.checkExpectedTokenBalanceIsDisplayed(
          MAINNET_LISTED_TOKEN_MINTED_AMOUNT,
          MAINNET_LISTED_TOKEN_SYMBOL,
        );
      },
    );
  });
});
