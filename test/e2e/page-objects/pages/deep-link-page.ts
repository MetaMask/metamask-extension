import assert from 'assert';
import { By } from 'selenium-webdriver';
import { Driver } from '../../webdriver/driver';
import { regularDelayMs } from '../../helpers';

/**
 * Deep-link security interstitial before continuing into an in-app route.
 *
 * Screen: `#/link` (and related deep-link interstitial UI).
 * Owns: description text, continue/cancel, skip-interstitial checkbox, and
 * loading-indicator absence checks on the interstitial.
 * Boundaries: the interstitial only. Destination routes after Continue belong
 * to their own page objects.
 * Related: deep-link helpers and destination screens opened after continue.
 *
 * @see ui/pages/deep-link/deep-link.tsx
 */
export default class DeepLink {
  private readonly cancelButton = '[data-testid="deep-link-cancel-button"]';

  private readonly checkbox: string = '[data-testid="deep-link-checkbox"]';

  private readonly continueButton = '[data-testid="deep-link-continue-button"]';

  private readonly descriptionBox = '[data-testid="deep-link-description"]';

  protected readonly driver: Driver;

  private readonly loadingIndicator = '[data-testid="loading-indicator"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Waits for the description box to display the given text.
   *
   * @param text - The expected (partial) text to wait for.
   */
  async checkDescriptionTextIsDisplayed(text: string): Promise<void> {
    await this.driver.waitForSelector({
      css: this.descriptionBox,
      text,
    });
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.descriptionBox);
      // loading indicator should not be present when the page is loaded
      await this.driver.assertElementNotPresent(this.loadingIndicator, {
        waitAtLeastGuard: regularDelayMs,
      });
    } catch (e) {
      console.log('Timeout while waiting for Deep Link page to be loaded', e);
      throw e;
    }
    console.log('Deep Link page is loaded');
  }

  async clickCancelButton() {
    try {
      await this.driver.clickElementAndWaitToDisappear(this.cancelButton);
    } catch (e) {
      console.log('Error clicking cancel button on Deep Link page', e);
      throw e;
    }
  }

  async clickContinueButton() {
    try {
      await this.driver.clickElementAndWaitToDisappear(this.continueButton);
    } catch (e) {
      console.log('Error clicking continue button on Deep Link page', e);
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

  async getDescriptionText(): Promise<string> {
    const routeBox = await this.driver.driver.findElement(
      By.css(this.descriptionBox),
    );
    assert.strictEqual(await routeBox.isDisplayed(), true);
    const routeText = await routeBox.getText();
    return routeText;
  }

  async getSkipDeepLinkInterstitialCheckBoxState(): Promise<boolean> {
    const skipCheckbox = await this.driver.findElement(
      '#dont-remind-me-checkbox',
    );
    return await skipCheckbox.isSelected();
  }

  async hasSkipDeepLinkInterstitialCheckBox(): Promise<boolean> {
    const skipCheckbox = await this.driver.driver.findElements(
      By.css(this.checkbox),
    );
    return skipCheckbox.length > 0;
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
}
