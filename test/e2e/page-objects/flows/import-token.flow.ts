import { Driver } from '../../webdriver/driver';
import { WINDOW_TITLES } from '../../helpers';
import HomePage from '../pages/home/homepage';
import { ImportTokensModal } from '../pages/import-tokens-modal';
import AssetListPage from '../pages/home/asset-list';

/**
 * Configuration for importing a custom token
 */
type TokenImportConfig = {
  contractAddress: string;
  networkChainId: string;
  tokenSymbol: string;
};

/**
 * Import a custom token using proper POM pattern and verify it appears in the asset list
 *
 * @param driver - The WebDriver instance
 * @param tokenConfig - Configuration for the token to import
 */
export async function importTestToken(
  driver: Driver,
  tokenConfig: TokenImportConfig,
): Promise<void> {
  console.log(
    `Starting token import for ${tokenConfig.contractAddress} on chain ${tokenConfig.networkChainId}`,
  );

  // Switch to MetaMask window
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);

  // Initialize page objects
  const homePage = new HomePage(driver);
  const importTokensModal = new ImportTokensModal(driver);

  // Open the import tokens modal using HomePage
  await homePage.openImportTokensModal();

  // Use ImportTokensModal to handle the import process
  await importTokensModal.importCustomToken(
    tokenConfig.contractAddress,
    tokenConfig.networkChainId,
  );

  // Wait for the import modal to close
  await driver.assertElementNotPresent('.import-tokens-modal');

  console.log('Custom token import completed successfully');

  // Navigate to tokens tab to see the imported token
  await homePage.goToTokensTab();

  // Verify token appears in asset list using existing AssetListPage
  const assetListPage = new AssetListPage(driver);
  await assetListPage.check_tokenExistsInList(tokenConfig.tokenSymbol);
}
