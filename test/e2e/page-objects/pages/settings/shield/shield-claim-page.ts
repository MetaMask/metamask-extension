// ShieldClaimPage class for interacting with the Shield Claim form page
import { Driver } from '../../../../webdriver/driver';

export default class ShieldClaimPage {
  private readonly driver: Driver;

  private readonly pageContainer = '[data-testid="submit-claim-page"]';

  private readonly claimSuccessToast = {
    text: 'Claim submitted successfully',
    tag: 'p',
  };

  private readonly accountSelectorButton =
    '[data-testid="account-selector-button"]';

  private readonly accountSelectorItem = '.account-selector-modal__account';

  private readonly accountSelectorItemByAddress = (address: string) =>
    `[data-testid="account-selector-account-item-${address.toLowerCase()}"]`;

  private readonly descriptionError =
    '[data-testid="shield-claim-description-error"]';

  private readonly descriptionTextarea =
    '[data-testid="shield-claim-description-textarea"]';

  private readonly emailHelpText = '[data-testid="shield-claim-help-text"]';

  private readonly emailInput = '[data-testid="shield-claim-email-input"]';

  private readonly fileUploader = '[data-testid="upload-images-file-uploader"]';

  private readonly hereLink = 'a[href="#"]';

  private readonly impactedTxHashInput =
    '[data-testid="shield-claim-impacted-tx-hash-input"]';

  private readonly networkSelectorButton =
    '[data-testid="network-selector-button"]';

  private readonly networkListItem = (chainId: string) =>
    `[data-testid="network-list-item-${chainId}"]`;

  private readonly reimbursementWalletAddressHelpText =
    '[data-testid="shield-claim-reimbursement-wallet-address-help-text"]';

  private readonly reimbursementWalletAddressInput =
    '[data-testid="shield-claim-reimbursement-wallet-address-input"]';

  private readonly submitButton = '[data-testid="shield-claim-submit-button"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Check if the Shield Claim page is loaded
   */
  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForMultipleSelectors([
      this.pageContainer,
      this.emailInput,
      this.submitButton,
    ]);
    console.log('Shield Claim page is loaded');
  }

  /**
   * Select an account from the AccountSelector modal
   *
   * @param accountName - The name of the account to select
   */
  async selectImpactedWalletAddress(accountName: string): Promise<void> {
    console.log(`Selecting impacted wallet address: ${accountName}`);
    // Click the account selector button to open the modal
    await this.driver.clickElement(this.accountSelectorButton);

    // Click the account with the specified name
    await this.driver.clickElement({
      css: this.accountSelectorItem,
      text: accountName,
    });

    console.log(`Account ${accountName} selected`);
  }

  /**
   * Select an account from the AccountSelector modal by address
   *
   * @param address - The address of the account to select
   */
  async selectImpactedWalletAddressByAddress(address: string): Promise<void> {
    console.log(`Selecting impacted wallet address by address: ${address}`);
    // Click the account selector button to open the modal
    await this.driver.clickElement(this.accountSelectorButton);

    // Click the account with the specified address
    await this.driver.clickElement(this.accountSelectorItemByAddress(address));

    console.log(`Account with address ${address} selected`);
  }

  /**
   * Select a network from the NetworkSelector modal
   *
   * @param chainId - The chain ID to select (e.g., '0x1' for Mainnet)
   */
  async selectNetwork(chainId: string): Promise<void> {
    console.log(`Selecting network with chain ID: ${chainId}`);
    // Click the network selector button to open the modal
    await this.driver.clickElement(this.networkSelectorButton);

    // Click the network with the specified chain ID
    await this.driver.clickElement(this.networkListItem(chainId));

    console.log(`Network with chain ID ${chainId} selected`);
  }

  /**
   * Fill in the email field
   *
   * @param email - The email address to fill
   */
  async fillEmail(email: string): Promise<void> {
    console.log(`Filling email: ${email}`);
    await this.driver.fill(this.emailInput, email);
  }

  /**
   * Fill in the impacted transaction hash field
   *
   * @param hash - The transaction hash to fill
   */
  async fillImpactedTransactionHash(hash: string): Promise<void> {
    console.log(`Filling impacted transaction hash: ${hash}`);
    await this.driver.fill(this.impactedTxHashInput, hash);
  }

  /**
   * Fill in the reimbursement wallet address field
   *
   * @param address - The wallet address to fill
   */
  async fillReimbursementWalletAddress(address: string): Promise<void> {
    console.log(`Filling reimbursement wallet address: ${address}`);
    await this.driver.fill(this.reimbursementWalletAddressInput, address);
  }

  /**
   * Fill in the case description textarea
   *
   * @param description - The description text to fill
   */
  async fillDescription(description: string): Promise<void> {
    console.log(`Filling description: ${description}`);
    await this.driver.fill(this.descriptionTextarea, description);
  }

  /**
   * Fill in the case description textarea and focus out to trigger validation
   *
   * @param description - The description text to fill
   */
  async fillDescriptionAndFocusOut(description: string): Promise<void> {
    await this.fillDescription(description);
    await this.driver.press(this.descriptionTextarea, 'Tab');
  }

  /**
   * Click the submit button
   */
  async clickSubmitButton(): Promise<void> {
    console.log('Clicking submit button');
    await this.driver.clickElement(this.submitButton);
  }

  /**
   * Click the "here" link
   */
  async clickHereLink(): Promise<void> {
    console.log('Clicking here link');
    await this.driver.clickElement(this.hereLink);
  }

  /**
   * Check if success toast message is displayed
   */
  async checkSuccessMessageDisplayed(): Promise<void> {
    await this.driver.waitForSelector(this.claimSuccessToast);
  }

  /**
   * Fill the entire form with provided data
   *
   * @param formData - The form data object containing all required fields
   * @param formData.email - The email address
   * @param formData.impactedWalletName - The impacted wallet name
   * @param formData.chainId - The chain ID (e.g., '0x1' for Mainnet)
   * @param formData.impactedTxnHash - The impacted transaction hash
   * @param formData.reimbursementWalletAddress - The reimbursement wallet address
   * @param formData.description - The case description
   * @param formData.files - Optional array of file paths to upload
   */
  async fillForm(formData: {
    email: string;
    reimbursementWalletAddress: string;
    impactedWalletName: string;
    chainId: string;
    impactedTxnHash: string;
    description: string;
    files?: string[];
  }): Promise<void> {
    console.log('Filling entire claim form');

    await this.fillEmail(formData.email);
    await this.fillReimbursementWalletAddress(
      formData.reimbursementWalletAddress,
    );
    await this.selectImpactedWalletAddress(formData.impactedWalletName);
    await this.selectNetwork(formData.chainId);
    await this.fillImpactedTransactionHash(formData.impactedTxnHash);
    await this.fillDescription(formData.description);

    console.log('Claim form filled successfully');
  }

  /**
   * Submit the form with provided data
   *
   * @param formData - The form data object containing all required fields
   * @param formData.email - The email address
   * @param formData.reimbursementWalletAddress - The reimbursement wallet address
   * @param formData.impactedWalletName - The impacted wallet name
   * @param formData.chainId - The chain ID (e.g., '0x1' for Mainnet)
   * @param formData.impactedTxnHash - The impacted transaction hash
   * @param formData.description - The case description
   * @param formData.files - Optional array of file paths to upload
   */
  async submitForm(formData: {
    email: string;
    reimbursementWalletAddress: string;
    impactedWalletName: string;
    chainId: string;
    impactedTxnHash: string;
    description: string;
    files?: string[];
  }): Promise<void> {
    console.log('Submitting claim form');

    await this.fillForm(formData);
    await this.clickSubmitButton();

    console.log('Claim form submitted');
  }
}
