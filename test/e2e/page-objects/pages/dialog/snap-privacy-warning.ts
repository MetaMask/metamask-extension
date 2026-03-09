import { Driver } from '../../../webdriver/driver';

/**
 * Page object for the "Third-party software notice" modal (SnapPrivacyWarning)
 * shown when connecting to a Snap for the first time.
 * The user must scroll to the bottom of the terms before Accept is enabled.
 */
class SnapPrivacyWarning {
  private driver: Driver;

  private readonly scrollButtonSelector =
    '[data-testid="snap-privacy-warning-scroll-down-arrow"]';

  private readonly acceptButton = {
    text: 'Accept',
    tag: 'button',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async scrollToBottomAndAccept(): Promise<void> {
    await this.driver.clickElement(this.scrollButtonSelector);
    await this.driver.waitForSelector(this.acceptButton, { state: 'enabled' });
    await this.driver.clickElementAndWaitToDisappear(this.acceptButton);
  }
}

export default SnapPrivacyWarning;
