import assert from 'assert';
import { By } from 'selenium-webdriver';
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

  /**
   * Waits for the extension-owned loading route and verifies that the tab has
   * left the public deep-link host while background verification is pending.
   *
   * @param sourceUrl - The intercepted deep-link URL.
   */
  async checkLoadingPageWasOpened(sourceUrl: string): Promise<void> {
    const source = new URL(sourceUrl);
    await this.driver.waitUntil(
      async () => {
        const currentUrl = new URL(await this.driver.getCurrentUrl());
        const [hashPath, hashQuery = ''] = currentUrl.hash.split('?');
        const hashParams = new URLSearchParams(hashQuery);

        return (
          currentUrl.host !== source.host &&
          currentUrl.pathname === '/home.html' &&
          hashPath === '#/link' &&
          hashParams.get('u') === `${source.pathname}${source.search}`
        );
      },
      { timeout: this.driver.timeout, interval: 100 },
    );

    const currentUrl = new URL(await this.driver.getCurrentUrl());
    const [hashPath, hashQuery = ''] = currentUrl.hash.split('?');
    const hashParams = new URLSearchParams(hashQuery);

    assert.notEqual(currentUrl.host, source.host);
    assert.equal(currentUrl.pathname, '/home.html');
    assert.equal(hashPath, '#/link');
    assert.equal(hashParams.get('u'), `${source.pathname}${source.search}`);
    await this.driver.waitForSelector(this.loadingIndicator);
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.descriptionBox,
        this.parentSelector,
      ]);
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
