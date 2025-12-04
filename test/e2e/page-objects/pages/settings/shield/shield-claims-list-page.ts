import { Driver } from '../../../../webdriver/driver';

export default class ShieldClaimsListPage {
  private readonly driver: Driver;

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

  async checkClaimStatus(claimId: string, statusText: string): Promise<void> {
    console.log(`Checking if claim ${claimId} has status: ${statusText}`);
    const claimItemSelector = this.claimItem(claimId);
    await this.driver.waitForSelector({
      css: claimItemSelector,
      text: statusText,
    });
  }

  async clickClaimItem(claimId: string): Promise<void> {
    console.log(`Clicking on claim ${claimId} to view details`);
    await this.driver.clickElement(this.claimItem(claimId));
  }
}
