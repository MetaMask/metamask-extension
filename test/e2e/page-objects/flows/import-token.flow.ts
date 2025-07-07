import { Driver } from '../../webdriver/driver';
import { WINDOW_TITLES } from '../../helpers';
import HomePage from '../pages/home/homepage';
import ImportTokensModal from '../pages/import-tokens-modal';
import AssetList from '../pages/asset-list';

/**
 * Configuration for importing a custom token
 */
type TokenImportConfig = {
  contractAddress: string;
  networkChainId: string;
};

/**
 * Import a custom token using proper POM pattern
 *
 * @param driver - The WebDriver instance
 * @param tokenConfig - Configuration for the token to import
 */
export async function importTestToken(
  driver: Driver,
  tokenConfig: TokenImportConfig,
): Promise<void> {
  console.log(
    `Starting custom token import for contract: ${tokenConfig.contractAddress}`,
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

  console.log('Custom token import completed successfully');
}

/**
 * Verify that a token appears in the asset list using proper POM pattern
 *
 * @param driver - The WebDriver instance
 * @param tokenSymbol - The symbol of the token to verify
 */
export async function verifyTokenInAssetList(
  driver: Driver,
  tokenSymbol: string,
): Promise<void> {
  console.log(`Verifying token ${tokenSymbol} appears in asset list`);

  // Use AssetList page object to verify token
  const assetList = new AssetList(driver);
  await assetList.verifyTokenIsVisible(tokenSymbol);

  console.log(
    `Token ${tokenSymbol} successfully imported and visible in asset list`,
  );
}

/**
 * Complete token import process including verification using proper POM pattern
 *
 * @param driver - The WebDriver instance
 * @param contractAddress - The contract address of the token
 * @param networkChainId - The network chain ID
 * @param tokenSymbol - The token symbol to verify
 */
export async function importAndVerifyTestToken(
  driver: Driver,
  contractAddress: string,
  networkChainId: string,
  tokenSymbol: string,
): Promise<void> {
  const tokenConfig: TokenImportConfig = {
    contractAddress,
    networkChainId,
  };

  await importTestToken(driver, tokenConfig);
  await verifyTokenInAssetList(driver, tokenSymbol);
}
