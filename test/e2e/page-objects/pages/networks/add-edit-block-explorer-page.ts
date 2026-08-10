import { Driver } from '../../../webdriver/driver';

/**
 * The block explorer URL sub-form of the network details form.
 *
 * Screen: `#/networks?view=add-explorer-url` and
 * `#/networks?view=edit-explorer-url`, reached from
 * `AddEditNetworkPage.openAddBlockExplorerPage`.
 * Owns: the block explorer URL field and saving the sub-form.
 * Boundaries: saving here only returns to the network form - the URL is not
 * persisted until that form is saved. Asserting the result belongs to
 * `AddEditNetworkPage`.
 * Related: `AddEditNetworkPage` (opens this, and where save returns to).
 *
 * @see ui/components/multichain/network-list-menu/add-block-explorer-modal/add-block-explorer-modal.tsx
 */
class AddEditBlockExplorerPage {
  private readonly blockExplorerUrlInput = {
    testId: 'explorer-url-input',
  };

  private readonly confirmButton = {
    text: 'Add URL',
    tag: 'button',
  };

  private readonly driver: Driver;

  private readonly pageTitle = {
    text: 'Add a block explorer URL',
    tag: 'p',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.pageTitle);
    } catch (e) {
      console.log(
        'Timeout while waiting for the block explorer URL page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Block explorer URL page is loaded');
  }

  /**
   * Fill the block explorer URL input field.
   *
   * @param blockExplorerUrl - The block explorer URL to fill in the input field.
   */
  async fillUrl(blockExplorerUrl: string): Promise<void> {
    console.log(
      `Fill block explorer URL input with ${blockExplorerUrl} on the block explorer URL page`,
    );
    await this.driver.fill(this.blockExplorerUrlInput, blockExplorerUrl);
  }

  async save(): Promise<void> {
    console.log('Confirm the added block explorer URL');
    await this.driver.clickElementAndWaitToDisappear(this.confirmButton);
  }
}

export default AddEditBlockExplorerPage;
