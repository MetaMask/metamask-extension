import { Driver } from '../../../webdriver/driver';

class TermsOfUseUpdateModal {
  private driver: Driver;

  private readonly acceptButton = {
    testId: 'terms-of-use-accept-button',
  };

  private readonly popoverScrollButton = {
    testId: 'popover-scroll-button',
  };

  private readonly termsOfUseCheckbox = {
    testId: 'terms-of-use-checkbox',
  };

  private readonly termsOfUseModalTitle = {
    text: 'Our Terms of Use have updated',
    tag: 'h2',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.termsOfUseModalTitle);
    } catch (e) {
      console.log(
        'Timeout while waiting for terms of use update modal to be loaded',
        e,
      );
      throw e;
    }
    console.log('Terms of use update modal is loaded');
  }

  async confirmAcceptTermsOfUseUpdate() {
    console.log('Click to confirm acceptance of terms of use update');
    await this.driver.clickElement(this.popoverScrollButton);
    await this.driver.clickElement(this.termsOfUseCheckbox);
    await this.driver.clickElementAndWaitToDisappear(this.acceptButton);
  }
}

export default TermsOfUseUpdateModal;
