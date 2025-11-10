import { Driver } from '../../../../webdriver/driver';

export default class ShieldClaimsListPage {
  private readonly driver: Driver;

  private readonly claimItem = (claimId: string) =>
    `[data-testid="claim-item-${claimId}"]`;

  private readonly pageContainer = '[data-testid="claims-list-page"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Check if the Shield Claims List page is loaded
   */
  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.pageContainer);
    console.log('Shield Claims List page is loaded');
  }

  /**
   * Check if a claim with the specified ID exists
   *
   * @param claimId - The ID of the claim to check
   */
  async checkClaimExists(claimId: string): Promise<void> {
    console.log(`Checking if claim ${claimId} exists`);
    await this.driver.waitForSelector(this.claimItem(claimId));
    console.log(`Claim ${claimId} found`);
  }

  /**
   * Check if a claim has a specific status by looking for the status tag text
   * Note: This checks for the translated status text in the UI
   *
   * @param claimId - The ID of the claim to check
   * @param statusText - The status text to verify (e.g., "Created", "Pending", "In Progress")
   */
  async checkClaimStatus(claimId: string, statusText: string): Promise<void> {
    console.log(`Checking if claim ${claimId} has status: ${statusText}`);
    const claimItemSelector = this.claimItem(claimId);
    // The status tag is within the claim item, so we check for the text within that element
    await this.driver.waitForSelector({
      css: claimItemSelector,
      text: statusText,
    });
    console.log(`Claim ${claimId} has status: ${statusText}`);
  }

  /**
   * Click on a claim item to view its details
   * This will navigate to the claim detail view page
   *
   * @param claimId - The ID of the claim to click
   */
  async clickClaimItem(claimId: string): Promise<void> {
    console.log(`Clicking on claim ${claimId} to view details`);
    await this.driver.clickElement(this.claimItem(claimId));
  }
}
