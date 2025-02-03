import { Driver } from '../../../../webdriver/driver';

class AddTokenConfirmation {
  driver: Driver;

  private readonly addTokenConfirmationTitle = {
    css: '.page-container__title',
    text: 'Add suggested tokens',
  };

  private readonly confirmAddTokenButton =
    '[data-testid="page-container-footer-next"]';

  private readonly rejectAddTokenButton =
    '[data-testid="page-container-footer-cancel"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.addTokenConfirmationTitle);
    } catch (e) {
      console.log(
        'Timeout while waiting for Add token confirmation page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Add token confirmation page is loaded');
  }

  async confirmAddToken(): Promise<void> {
    console.log('Confirm add token');
    await this.driver.clickElementAndWaitForWindowToClose(
      this.confirmAddTokenButton,
    );
  }

  async rejectAddToken(): Promise<void> {
    console.log('Reject add token');
    await this.driver.clickElementAndWaitForWindowToClose(
      this.rejectAddTokenButton,
    );
  }
}

export default AddTokenConfirmation;
