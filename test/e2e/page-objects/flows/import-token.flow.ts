import { Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';
import HeaderNavbar from '../pages/header-navbar';

const WINDOW_TITLES = {
  ExtensionInFullScreenView: 'MetaMask',
};

/**
 * Interface for token import configuration
 */
export interface TokenImportConfig {
  contractAddress: string;
  networkChainId?: string; // e.g., '0x539' for local testnet
  networkName?: string;    // Optional network name for verification
}

/**
 * Imports a custom ERC20 token using the MetaMask UI
 *
 * @param driver - The webdriver instance
 * @param tokenConfig - Configuration object containing token details
 */
export const importCustomToken = async (
  driver: Driver,
  tokenConfig: TokenImportConfig,
): Promise<void> => {
  console.log(`Starting custom token import for contract: ${tokenConfig.contractAddress}`);

  // Ensure we're on the MetaMask main window
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);

  // Click the asset list control bar action button (+ icon)
  await driver.clickElement('[data-testid="asset-list-control-bar-action-button"]');

  // Click Import Tokens option
  await driver.clickElement('[data-testid="importTokens"]');

  // Wait for the import tokens modal to load and click Custom token tab
  await driver.waitForSelector({
    css: '.import-tokens-modal__button-tab',
    text: 'Custom token',
  });

  await driver.clickElement({
    css: '.import-tokens-modal__button-tab',
    text: 'Custom token',
  });

  // If a specific network is specified, select it
  if (tokenConfig.networkChainId) {
    console.log(`Selecting network with chain ID: ${tokenConfig.networkChainId}`);
    await driver.clickElement('[data-testid="test-import-tokens-drop-down-custom-import"]');
    await driver.clickElement(`[data-testid="select-network-item-${tokenConfig.networkChainId}"]`);
  }

  // Fill in the contract address
  console.log(`Filling contract address: ${tokenConfig.contractAddress}`);
  await driver.fill(
    '[data-testid="import-tokens-modal-custom-address"]',
    tokenConfig.contractAddress,
  );

  // Click Next button and wait for it to disappear (indicating validation success)
  await driver.clickElementAndWaitToDisappear({
    css: '[data-testid="import-tokens-button-next"]',
    text: 'Next',
  });

  // Click Import button to complete the import
  await driver.clickElement({
    css: '[data-testid="import-tokens-modal-import-button"]',
    text: 'Import',
  });

  console.log('Custom token import completed successfully');
};

/**
 * Simplified token import for common test scenarios with predefined test token
 *
 * @param driver - The webdriver instance
 * @param contractAddress - The token contract address
 */
export const importTestToken = async (
  driver: Driver,
  contractAddress: string,
): Promise<void> => {
  const tokenConfig: TokenImportConfig = {
    contractAddress,
    networkChainId: '0x539', // Default to local test network
  };

  await importCustomToken(driver, tokenConfig);
};

/**
 * Verifies that a token has been successfully imported by checking if it appears in the token list
 *
 * @param driver - The webdriver instance
 * @param tokenSymbol - The symbol of the imported token (e.g., 'TST', 'HST')
 */
export const verifyTokenImported = async (
  driver: Driver,
  tokenSymbol: string,
): Promise<void> => {
  console.log(`Verifying token ${tokenSymbol} has been imported`);

  // Check if the token appears in the asset list
  await driver.waitForSelector({
    css: '[data-testid="multichain-token-list-item"]',
    text: tokenSymbol,
  });

  console.log(`Token ${tokenSymbol} successfully imported and visible in asset list`);
};

/**
 * Complete flow that imports a token and verifies it was imported successfully
 *
 * @param driver - The webdriver instance
 * @param tokenConfig - Configuration object containing token details
 * @param expectedSymbol - The expected token symbol to verify after import
 */
export const importAndVerifyToken = async (
  driver: Driver,
  tokenConfig: TokenImportConfig,
  expectedSymbol: string,
): Promise<void> => {
  await importCustomToken(driver, tokenConfig);
  await verifyTokenImported(driver, expectedSymbol);
};