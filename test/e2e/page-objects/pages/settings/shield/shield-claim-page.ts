// ShieldClaimPage class for interacting with the Shield Claim form page
import { Driver } from '../../../../webdriver/driver';

export default class ShieldClaimPage {
  private readonly driver: Driver;

  // Page identification
  private readonly pageContainer = '[data-testid="submit-claim-page"]';

  // Locators (alphabetically ordered)
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

  private readonly impactedWalletAddressHelpText =
    '[data-testid="shield-claim-impacted-wallet-address-help-text"]';

  private readonly impactedWalletAddressInput =
    '[data-testid="shield-claim-impacted-wallet-address-input"]';

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
   * Fill in the email field
   *
   * @param email - The email address to fill
   */
  async fillEmail(email: string): Promise<void> {
    console.log(`Filling email: ${email}`);
    await this.driver.fill(this.emailInput, email);
  }

  /**
   * Fill in the impacted wallet address field
   *
   * @param address - The wallet address to fill
   */
  async fillImpactedWalletAddress(address: string): Promise<void> {
    console.log(`Filling impacted wallet address: ${address}`);
    await this.driver.fill(this.impactedWalletAddressInput, address);
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
   * @param formData.impactedWalletAddress - The impacted wallet address
   * @param formData.impactedTransactionHash - The impacted transaction hash
   * @param formData.reimbursementWalletAddress - The reimbursement wallet address
   * @param formData.description - The case description
   * @param formData.files - Optional array of file paths to upload
   */
  async fillForm(formData: {
    email: string;
    impactedWalletAddress: string;
    impactedTransactionHash: string;
    reimbursementWalletAddress: string;
    description: string;
    files?: string[];
  }): Promise<void> {
    console.log('Filling entire claim form');

    await this.fillEmail(formData.email);
    await this.fillImpactedWalletAddress(formData.impactedWalletAddress);
    await this.fillImpactedTransactionHash(formData.impactedTransactionHash);
    await this.fillReimbursementWalletAddress(
      formData.reimbursementWalletAddress,
    );
    await this.fillDescription(formData.description);

    console.log('Claim form filled successfully');
  }

  /**
   * Submit the form with provided data
   *
   * @param formData - The form data object containing all required fields
   * @param formData.email - The email address
   * @param formData.impactedWalletAddress - The impacted wallet address
   * @param formData.impactedTransactionHash - The impacted transaction hash
   * @param formData.reimbursementWalletAddress - The reimbursement wallet address
   * @param formData.description - The case description
   * @param formData.files - Optional array of file paths to upload
   */
  async submitForm(formData: {
    email: string;
    impactedWalletAddress: string;
    impactedTransactionHash: string;
    reimbursementWalletAddress: string;
    description: string;
    files?: string[];
  }): Promise<void> {
    console.log('Submitting claim form');

    await this.fillForm(formData);
    await this.clickSubmitButton();

    console.log('Claim form submitted');
  }
}
