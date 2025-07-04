import assert from 'assert';
import { By } from 'selenium-webdriver';
import { Driver } from '../../webdriver/driver';

export default class DeepLink {
  protected readonly driver: Driver;

  private readonly checkbox: string = '[data-testid="deep-link-checkbox"]';

  private readonly descriptionBox = '[data-testid="deep-link-description"]';

  private readonly continueButton = '[data-testid="deep-link-continue-button"]';

  private readonly cancelButton = '[data-testid="deep-link-cancel-button"]';

  private readonly loadingIndicator = '[data-testid="loading-indicator"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.descriptionBox);
      // loading indicator should not be present when the page is loaded
      const element = await this.driver.driver.findElements(
        By.css(this.loadingIndicator),
      );
      assert.equal(
        element.length,
        0,
        'Loading indicator should not be present',
      );
    } catch (e) {
      console.log('Timeout while waiting for Deep Link page to be loaded', e);
      throw e;
    }
    console.log('Deep Link page is loaded');
  }

  async clickContinueButton() {
    try {
      await this.driver.clickElementAndWaitToDisappear(this.continueButton);
    } catch (e) {
      console.log('Error clicking continue button on Deep Link page', e);
      throw e;
    }
  }

  async clickCancelButton() {
    try {
      await this.driver.clickElementAndWaitToDisappear(this.cancelButton);
    } catch (e) {
      console.log('Error clicking cancel button on Deep Link page', e);
      throw e;
    }
  }

  async clickSkipDeepLinkInterstitialCheckBox() {
    try {
      await this.driver.clickElement(this.checkbox);
    } catch (e) {
      console.log(
        'Error clicking skip deep link interstitial checkbox on Deep Link page',
        e,
      );
      throw e;
    }
  }

  async hasSkipDeepLinkInterstitialCheckBox(): Promise<boolean> {
    const skipCheckbox = await this.driver.driver.findElements(
      By.css(this.checkbox),
    );
    return skipCheckbox.length > 0;
  }

  async getSkipDeepLinkInterstitialCheckBoxState(): Promise<boolean> {
    const skipCheckbox = await this.driver.findElement(
      '#dont-remind-me-checkbox',
    );
    return await skipCheckbox.isSelected();
  }

  async setSkipDeepLinkInterstitialCheckBox(skip: boolean): Promise<void> {
    const isChecked = await this.getSkipDeepLinkInterstitialCheckBoxState();
    if (skip) {
      if (!isChecked) {
        await this.clickSkipDeepLinkInterstitialCheckBox();
      }
    } else if (isChecked) {
      await this.clickSkipDeepLinkInterstitialCheckBox();
    }
  }

  async getDescriptionText(): Promise<string> {
    const routeBox = await this.driver.driver.findElement(
      By.css(this.descriptionBox),
    );
    assert.strictEqual(await routeBox.isDisplayed(), true);
    const routeText = await routeBox.getText();
    return routeText;
  }
}
