import { Driver } from '../../../../webdriver/driver';

export default class ShieldClaimsListPage {
  private readonly driver: Driver;

  private readonly activeClaimsHeading = {
    text: 'Active claims',
    tag: 'h4',
  };

  private readonly claimHistoryButton = {
    text: 'Claim history',
    tag: 'button',
  };

  private readonly claimItem = (claimId: string) =>
    `[data-testid="claim-item-${claimId}"]`;

  private readonly claimsButton = {
    text: 'Claims',
    tag: 'button',
  };

  private readonly completedClaimsHeading = {
    text: 'Completed claims',
    tag: 'h4',
  };

  private readonly emptyNewClaimButton =
    '[data-testid="claims-list-empty-new-claim-button"]';

  private readonly noCompletedClaimsHeading = {
    text: 'No completed claims',
    tag: 'h4',
  };

  private readonly noOpenClaimsHeading = {
    text: 'No open claims',
    tag: 'h4',
  };

  private readonly pageContainer = '[data-testid="claims-list-page"]';

  private readonly rejectedClaimsHeading = {
    text: 'Rejected claims',
    tag: 'h4',
  };

  private readonly submitClaimButton =
    '[data-testid="claims-list-submit-claim-button"]';

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

  async checkCompletedClaimsDisplayed(): Promise<void> {
    console.log('Checking if completed claims are displayed');
    await this.driver.waitForSelector(this.completedClaimsHeading);
  }

  async checkHistoryTabEmptyState(): Promise<void> {
    console.log('Checking if history tab shows empty state');
    await this.driver.waitForSelector(this.noCompletedClaimsHeading);
  }

  async checkPendingClaimsDisplayed(): Promise<void> {
    console.log('Checking if pending claims are displayed');
    await this.driver.waitForSelector(this.activeClaimsHeading);
  }

  async checkPendingTabEmptyState(): Promise<void> {
    console.log('Checking if pending tab shows empty state');
    await this.driver.waitForSelector(this.noOpenClaimsHeading);
    await this.driver.waitForSelector(this.emptyNewClaimButton);
  }

  async checkRejectedClaimsDisplayed(): Promise<void> {
    console.log('Checking if rejected claims are displayed');
    await this.driver.waitForSelector(this.rejectedClaimsHeading);
  }

  async clickHistoryTab(): Promise<void> {
    console.log('Clicking on History tab');
    await this.driver.clickElement(this.claimHistoryButton);
  }

  async clickPendingTab(): Promise<void> {
    console.log('Clicking on Claims tab');
    await this.driver.clickElement(this.claimsButton);
  }

  async checkSubmitClaimButtonDisabled(): Promise<void> {
    console.log('Checking if submit claim button is disabled');
    await this.driver.waitForSelector(this.submitClaimButton, {
      state: 'disabled',
    });
  }

  async checkThreeClaimsDisplayed(): Promise<void> {
    console.log('Checking if exactly 3 claims are displayed');
    await this.driver.wait(async () => {
      const claimItems = await this.driver.findElements(
        '[data-testid^="claim-item-"]',
      );
      return claimItems.length === 3;
    }, 10000);
  }
}
