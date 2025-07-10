import { Driver } from '../../webdriver/driver';

/**
 * Page Object Model for the Import Tokens Modal
 *
 * Centralizes all selectors and provides methods to interact with the modal
 */
export class ImportTokensModal {
  // Centralized selectors as constants
  private static readonly selectors = {
    // Modal elements
    customTokenTab: '.import-tokens-modal__button-tab',
    networkDropdown:
      '[data-testid="test-import-tokens-drop-down-custom-import"]',
    contractAddressInput: '[data-testid="import-tokens-modal-custom-address"]',
    nextButton: '[data-testid="import-tokens-button-next"]',
    importButton: '[data-testid="import-tokens-modal-import-button"]',

    // Network selection
    networkItemPrefix: '[data-testid="select-network-item-',
  } as const;

  private driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Clicks the Custom Token tab
   */
  async clickCustomTokenTab(): Promise<void> {
    await this.driver.waitForSelector({
      css: ImportTokensModal.selectors.customTokenTab,
      text: 'Custom token',
    });

    await this.driver.clickElement({
      css: ImportTokensModal.selectors.customTokenTab,
      text: 'Custom token',
    });
  }

  /**
   * Selects a specific network by chain ID
   *
   * @param chainId - The chain ID (e.g., '0x539')
   */
  async selectNetwork(chainId: string): Promise<void> {
    await this.driver.clickElement(ImportTokensModal.selectors.networkDropdown);
    await this.driver.clickElement(
      `${ImportTokensModal.selectors.networkItemPrefix}${chainId}"]`,
    );
  }

  /**
   * Fills the contract address input field
   *
   * @param contractAddress - The token contract address
   */
  async fillContractAddress(contractAddress: string): Promise<void> {
    await this.driver.fill(
      ImportTokensModal.selectors.contractAddressInput,
      contractAddress,
    );
  }

  /**
   * Clicks the Next button and waits for it to disappear (validation success)
   */
  async clickNextAndWaitForValidation(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear({
      css: ImportTokensModal.selectors.nextButton,
      text: 'Next',
    });
  }

  /**
   * Clicks the Import button to complete the import
   */
  async clickImport(): Promise<void> {
    await this.driver.clickElement({
      css: ImportTokensModal.selectors.importButton,
      text: 'Import',
    });
  }

  /**
   * Complete flow to import a custom token
   *
   * @param contractAddress - The token contract address
   * @param chainId - Chain ID to select specific network
   */
  async importCustomToken(
    contractAddress: string,
    chainId: string,
  ): Promise<void> {
    await this.clickCustomTokenTab();
    await this.selectNetwork(chainId);
    await this.fillContractAddress(contractAddress);
    await this.clickNextAndWaitForValidation();
    await this.clickImport();
  }
}

export default ImportTokensModal;
