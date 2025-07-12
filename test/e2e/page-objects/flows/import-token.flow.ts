import { Driver } from '../../webdriver/driver';
import { WINDOW_TITLES } from '../../helpers';
import HomePage from '../pages/home/homepage';
import { ImportTokensModal } from '../pages/import-tokens-modal';

/**
 * Configuration for importing a custom token
 */
type TokenImportConfig = {
  contractAddress: string;
  networkChainId: string;
};

/**
 * Import a custom token using the original simple approach
 * This matches the working behavior before verification was added
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

  console.log('Custom token import completed successfully');
}

