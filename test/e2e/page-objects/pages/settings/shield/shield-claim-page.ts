// ShieldClaimPage class for interacting with the Shield Claim form page
import { Driver } from '../../../../webdriver/driver';

export default class ShieldClaimPage {
  private readonly driver: Driver;

  private readonly accountSelectorButton =
    '[data-testid="account-selector-button"]';

  private readonly accountSelectorItem = '.account-selector-modal__account';

  private readonly accountSelectorItemByName = (accountName: string) => ({
    css: this.accountSelectorItem,
    text: accountName,
  });

  private readonly claimSuccessToast = {
    text: 'Claim submitted successfully',
    tag: 'p',
  };

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

  private readonly networkListItem = (chainId: string) =>
    `[data-testid="network-list-item-${chainId}"]`;

  private readonly networkSelectorButton =
    '[data-testid="network-selector-button"]';

  private readonly pageContainer = '[data-testid="submit-claim-page"]';

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

  async checkPageIsLoadedInViewMode(): Promise<void> {
    await this.driver.waitForMultipleSelectors([
      this.pageContainer,
      this.emailInput,
    ]);
    console.log('Shield Claim page is loaded in view mode');
  }

  async selectImpactedWalletName(accountName: string): Promise<void> {
    console.log(`Selecting impacted wallet address: ${accountName}`);
    await this.driver.clickElement(this.accountSelectorButton);

    await this.driver.clickElement(this.accountSelectorItemByName(accountName));

    console.log(`Account ${accountName} selected`);
  }

  async selectNetwork(chainId: string): Promise<void> {
    console.log(`Selecting network with chain ID: ${chainId}`);
    await this.driver.clickElement(this.networkSelectorButton);
    await this.driver.clickElement(this.networkListItem(chainId));
  }

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
   * Click the submit button
   */
  async clickSubmitButton(): Promise<void> {
    console.log('Clicking submit button');
    await this.driver.clickElement(this.submitButton);
  }

  async checkSuccessMessageDisplayed(): Promise<void> {
    await this.driver.waitForSelector(this.claimSuccessToast);
  }

  async verifyClaimData(claimData: {
    email: string;
    reimbursementWalletAddress: string;
    impactedTxHash: string;
    description: string;
  }): Promise<void> {
    console.log('Verifying claim data is displayed correctly');

    // Verify email - using css and value pattern
    await this.driver.waitForSelector({
      css: this.emailInput,
      value: claimData.email,
    });
    console.log(`Email verified: ${claimData.email}`);

    // Verify reimbursement wallet address
    await this.driver.waitForSelector({
      css: this.reimbursementWalletAddressInput,
      value: claimData.reimbursementWalletAddress,
    });
    console.log(
      `Reimbursement wallet address verified: ${claimData.reimbursementWalletAddress}`,
    );

    // Verify impacted transaction hash
    await this.driver.waitForSelector({
      css: this.impactedTxHashInput,
      value: claimData.impactedTxHash,
    });
    console.log(
      `Impacted transaction hash verified: ${claimData.impactedTxHash}`,
    );

    // Verify description - using css and text pattern
    await this.driver.waitForSelector({
      css: this.descriptionTextarea,
      text: claimData.description,
    });
    console.log(`Description verified: ${claimData.description}`);

    console.log('All claim data verified successfully');
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
    await this.selectImpactedWalletName(formData.impactedWalletName);
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
