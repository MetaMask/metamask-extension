import { Driver } from '../../webdriver/driver';

/**
 * Configuration for importing a custom token
 */
type TokenImportConfig = {
  contractAddress: string;
  networkChainId: string;
};

/**
 * Import a custom token by navigating through the token import flow
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
  await driver.switchToWindowWithTitle('MetaMask');

  // Navigate to import tokens
  await driver.clickElement(
    '[data-testid="asset-list-control-bar-action-button"]',
  );
  await driver.clickElement('[data-testid="importTokens"]');

  // Select custom token tab
  await driver.waitForSelector({
    css: '.import-tokens-modal__button-tab',
    text: 'Custom token',
  });
  await driver.clickElement({
    css: '.import-tokens-modal__button-tab',
    text: 'Custom token',
  });

  // Select network
  console.log(`Selecting network with chain ID: ${tokenConfig.networkChainId}`);
  await driver.clickElement(
    '[data-testid="test-import-tokens-drop-down-custom-import"]',
  );
  await driver.clickElement(
    `[data-testid="select-network-item-${tokenConfig.networkChainId}"]`,
  );

  // Fill contract address
  console.log(`Filling contract address: ${tokenConfig.contractAddress}`);
  await driver.fill(
    '[data-testid="import-tokens-modal-custom-address"]',
    tokenConfig.contractAddress,
  );

  // Click Next
  await driver.clickElementAndWaitToDisappear({
    css: '[data-testid="import-tokens-button-next"]',
    text: 'Next',
  });

  // Import token
  await driver.clickElement({
    css: '[data-testid="import-tokens-modal-import-button"]',
    text: 'Import',
  });

  console.log('Custom token import completed successfully');
}

/**
 * Verify that a token appears in the asset list
 *
 * @param driver - The WebDriver instance
 * @param tokenSymbol - The symbol of the token to verify
 */
export async function verifyTokenInAssetList(
  driver: Driver,
  tokenSymbol: string,
): Promise<void> {
  console.log(`Verifying token ${tokenSymbol} appears in asset list`);

  // Wait for the token to appear in the asset list
  await driver.waitForSelector(
    `[data-testid="asset-list-item-${tokenSymbol}"]`,
  );

  console.log(
    `Token ${tokenSymbol} successfully imported and visible in asset list`,
  );
}

/**
 * Complete token import process including verification
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