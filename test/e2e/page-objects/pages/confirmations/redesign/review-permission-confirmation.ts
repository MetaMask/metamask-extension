import { Driver } from '../../../../webdriver/driver';

class ReviewPermissionConfirmation {
  private driver: Driver;

  private readonly confirmationDialogTitle = {
    tag: 'h3',
    text: 'Review permissions',
  };

  private readonly footerCancelButton =
    '[data-testid="page-container-footer-cancel"]';

  private readonly footerConfirmButton =
    '[data-testid="page-container-footer-next"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.confirmationDialogTitle);
    } catch (e) {
      console.log(
        'Timeout while waiting for Review Permission Confirmation page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Review Permission Confirmation page is loaded');
  }

  async cancelReviewPermissions() {
    console.log('Cancel review permissions in dialog');
    await this.driver.clickElementAndWaitToDisappear(this.footerCancelButton);
  }

  async confirmReviewPermissions() {
    console.log('Confirm review permissions in dialog');
    await this.driver.clickElementAndWaitToDisappear(this.footerConfirmButton);
  }
}

export default ReviewPermissionConfirmation;
