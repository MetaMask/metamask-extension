import { Driver } from '../../../webdriver/driver';

/**
 * Import NFT form: network, contract address, and token id.
 *
 * Screen: Import NFT modal, opened from the home NFTs tab via
 * `NftsTab.openImportNft()`.
 * Owns: page-loaded check, local-network selection, address and token id,
 * submit, and the ownership error shown when import fails.
 * Boundaries: the import form only. The NFTs tab menu that opens this screen,
 * and the success toast after it closes, stay on `NftsTab`.
 * Related: `NftsTab`.
 *
 * @see ui/components/multichain/import-nfts-modal/import-nfts-modal.js
 */
class ImportNftPage {
  private readonly confirmImportNftButton =
    '[data-testid="import-nfts-modal-import-button"]';

  private readonly driver: Driver;

  private readonly importNftAddressInput = '#address';

  private readonly importNftErrorMessageByText = (errorMessage: string) => ({
    tag: 'p',
    text: errorMessage,
  });

  private readonly importNftNetworkDropdown =
    '[data-testid="test-import-tokens-drop-down-custom-import"]';

  private readonly importNftNetworkName =
    '[data-testid="network-list-item-0x539"]';

  private readonly importNftTitle = { text: 'Import NFT', tag: 'p' };

  private readonly importNftTokenIdInput = '#token-id';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Checks if the Import NFT page is loaded.
   */
  async checkPageIsLoaded(): Promise<void> {
    console.log('Check that the Import NFT page is loaded');
    await this.driver.waitForSelector(this.importNftTitle);
  }

  /**
   * Imports an NFT by selecting the local network and entering the contract
   * address and token ID.
   *
   * @param nftContractAddress - The address of the NFT contract to import.
   * @param id - The ID of the NFT to import.
   * @param expectedErrorMessage - Expected error message if the import should fail.
   */
  async importNft(
    nftContractAddress: string,
    id: string,
    expectedErrorMessage?: string,
  ): Promise<void> {
    console.log(
      `Import NFT at address ${nftContractAddress} with token id ${id}`,
    );
    await this.driver.clickElement(this.importNftNetworkDropdown);
    await this.driver.clickElement(this.importNftNetworkName);
    await this.driver.fill(this.importNftAddressInput, nftContractAddress);
    await this.driver.fill(this.importNftTokenIdInput, id);
    if (expectedErrorMessage) {
      await this.driver.clickElement(this.confirmImportNftButton);
      await this.driver.waitForSelector(
        this.importNftErrorMessageByText(expectedErrorMessage),
      );
      return;
    }
    await this.driver.clickElementAndWaitToDisappear(
      this.confirmImportNftButton,
    );
  }
}

export default ImportNftPage;
