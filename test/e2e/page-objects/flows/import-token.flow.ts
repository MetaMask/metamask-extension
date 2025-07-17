import { Driver } from '../../webdriver/driver';
import { WINDOW_TITLES } from '../../helpers';
import AssetListPage from '../pages/home/asset-list';
import { ImportTokensModal } from '../pages/import-tokens-modal';

/**
 * Import a custom token using the original simple approach
 * This matches the working behavior before verification was added
 *
 * @param driver - The WebDriver instance
 * @param contractAddress - The contract address of the token
 * @param networkChainId - The chain ID of the network
 */
export async function importTestToken(
  driver: Driver,
  contractAddress: string,
  networkChainId: string,
): Promise<void> {
  console.log(
    `Starting token import for ${contractAddress} on chain ${networkChainId}`,
  );

  // Switch to MetaMask window
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);

  // Initialize page objects
  const assetListPage = new AssetListPage(driver);
  const importTokensModal = new ImportTokensModal(driver);

  // Open the import tokens modal using AssetListPage
  await assetListPage.openImportTokensModal();

  // Use ImportTokensModal to handle the import process
  await importTokensModal.importCustomToken(contractAddress, networkChainId);

  console.log('Custom token import completed successfully');
}
