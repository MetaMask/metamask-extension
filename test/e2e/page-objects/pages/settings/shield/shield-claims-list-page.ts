import { Driver } from '../../../../webdriver/driver';

export default class ShieldClaimsListPage {
  private readonly driver: Driver;

  private readonly emptyNewClaimButton =
    '[data-testid="claims-list-empty-new-claim-button"]';

  private readonly submitClaimButton =
    '[data-testid="claims-list-submit-claim-button"]';

  private readonly claimItem = (claimId: string) =>
    `[data-testid="claim-item-${claimId}"]`;

  private readonly pageContainer = '[data-testid="claims-list-page"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.pageContainer);
    console.log('Shield Claims List page is loaded');
  }

  async checkClaimExists(claimId: string): Promise<void> {
    console.log(`Checking if claim ${claimId} exists`);
    await this.driver.waitForSelector(this.claimItem(claimId));
  }

  async clickClaimItem(claimId: string): Promise<void> {
    console.log(`Clicking on claim ${claimId} to view details`);
    await this.driver.clickElement(this.claimItem(claimId));
  }

  async clickEmptyNewClaimButton(): Promise<void> {
    console.log('Clicking on empty new claim button');
    await this.driver.clickElement(this.emptyNewClaimButton);
  }

  async clickSubmitClaimButton(): Promise<void> {
    console.log('Clicking on submit claim button');
    await this.driver.clickElement(this.submitClaimButton);
  }

  /**
   * Check if the Claims tab (pending) shows empty state
   */
  async checkPendingTabEmptyState(): Promise<void> {
    console.log('Checking if pending tab shows empty state');
    await this.driver.waitForSelector({
      text: 'No open claims',
      tag: 'h4',
    });
    await this.driver.waitForSelector(this.emptyNewClaimButton);
  }

  /**
   * Check if the History tab shows empty state
   */
  async checkHistoryTabEmptyState(): Promise<void> {
    console.log('Checking if history tab shows empty state');
    await this.driver.waitForSelector({
      text: 'No completed claims',
      tag: 'h4',
    });
  }

  /**
   * Click on the History tab
   */
  async clickHistoryTab(): Promise<void> {
    console.log('Clicking on History tab');
    await this.driver.clickElement({
      text: 'Claim history',
      tag: 'button',
    });
  }

  /**
   * Click on the Claims tab (pending)
   */
  async clickPendingTab(): Promise<void> {
    console.log('Clicking on Claims tab');
    await this.driver.clickElement({
      text: 'Claims',
      tag: 'button',
    });
  }

  /**
   * Check if pending claims are displayed
   */
  async checkPendingClaimsDisplayed(): Promise<void> {
    console.log('Checking if pending claims are displayed');
    await this.driver.waitForSelector({
      text: 'Active claims',
      tag: 'h4',
    });
  }

  /**
   * Check if completed claims are displayed
   */
  async checkCompletedClaimsDisplayed(): Promise<void> {
    console.log('Checking if completed claims are displayed');
    await this.driver.waitForSelector({
      text: 'Completed claims',
      tag: 'h4',
    });
  }

  /**
   * Check if rejected claims are displayed
   */
  async checkRejectedClaimsDisplayed(): Promise<void> {
    console.log('Checking if rejected claims are displayed');
    await this.driver.waitForSelector({
      text: 'Rejected claims',
      tag: 'h4',
    });
  }

  /**
   * Check if the Submit a claim button is disabled
   */
  async checkSubmitClaimButtonDisabled(): Promise<void> {
    console.log('Checking if submit claim button is disabled');
    await this.driver.waitForSelector(this.submitClaimButton, {
      state: 'disabled',
    });
  }

  /**
   * Verify that exactly 3 claims are displayed
   */
  async checkThreeClaimsDisplayed(): Promise<void> {
    console.log('Checking if exactly 3 claims are displayed');
    const claimItems = await this.driver.findElements(
      '[data-testid^="claim-item-"]',
    );
    if (claimItems.length !== 3) {
      throw new Error(
        `Expected 3 claims but found ${claimItems.length} claims`,
      );
    }
    console.log('Verified that exactly 3 claims are displayed');
  }
}
