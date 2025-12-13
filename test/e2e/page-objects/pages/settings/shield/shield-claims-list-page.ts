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
}
