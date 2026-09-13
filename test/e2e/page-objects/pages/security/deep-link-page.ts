import { Driver } from '../../../webdriver/driver';
import { regularDelayMs } from '../../../helpers';

/**
 * Deep-link security interstitial before continuing into an in-app route.
 *
 * Screen: `#/link` (and related deep-link interstitial UI).
 * Owns: description text, continue, skip-interstitial checkbox, and
 * loading-indicator absence checks on the interstitial.
 * Boundaries: the interstitial only. Destination routes after Continue belong
 * to their own page objects.
 * Related: deep-link helpers and destination screens opened after continue.
 *
 * @see ui/pages/deep-link/deep-link.tsx
 */
export default class DeepLink {
  private readonly checkbox: string = '[data-testid="deep-link-checkbox"]';

  private readonly continueButton = '[data-testid="deep-link-continue-button"]';

  private readonly descriptionBox = '[data-testid="deep-link-description"]';

  private readonly driver: Driver;

  private readonly loadingIndicator = '[data-testid="loading-indicator"]';

  private readonly parentSelector = {
    testId: 'parent-selector-deep-link-page',
  };

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
    await this.driver.waitForMultipleSelectors([
      this.descriptionBox,
      this.parentSelector,
    ]);
    // loading indicator should not be present when the page is loaded
    await this.driver.assertElementNotPresent(this.loadingIndicator, {
      waitAtLeastGuard: regularDelayMs,
    });
    console.log('Deep Link page is loaded');
  }

  /**
   * Waits for the skip-interstitial checkbox to be present or absent.
   *
   * @param shouldBeDisplayed - Whether the checkbox should be shown.
   */
  async checkSkipDeepLinkInterstitialCheckBoxIsDisplayed(
    shouldBeDisplayed: boolean,
  ): Promise<void> {
    if (shouldBeDisplayed) {
      await this.driver.waitForSelector(this.checkbox);
    } else {
      await this.driver.assertElementNotPresent(this.checkbox);
    }
  }

  async clickContinueButton(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(this.continueButton);
  }

  async clickSkipDeepLinkInterstitialCheckBox(): Promise<void> {
    await this.driver.clickElement(this.checkbox);
  }

  /**
   * Loads the interstitial, asserts skip-checkbox presence, and continues.
   *
   * @param shouldShowCheckbox - Whether the skip checkbox should be rendered
   * (signed links show it; unsigned/invalid links do not).
   */
  async continueFromInterstitial(shouldShowCheckbox: boolean): Promise<void> {
    console.log('Checking if deep link page is loaded');
    await this.checkPageIsLoaded();

    console.log('Checking if deep link interstitial checkbox exists');
    await this.checkSkipDeepLinkInterstitialCheckBoxIsDisplayed(
      shouldShowCheckbox,
    );

    console.log('Clicking continue button');
    await this.clickContinueButton();
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
}
