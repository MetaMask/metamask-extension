import { Driver } from '../../../webdriver/driver';

/**
 * Terms of Use update popup shown when the user must re-accept updated terms.
 *
 * Screen: modal layered over the home / post-login UI when a terms update is
 * required (also reachable from settings terms flows).
 * Owns: scroll-to-bottom control, agree checkbox enablement, and the accept
 * button that dismisses the modal.
 * Boundaries: stops at the terms popup. Does not cover first-time onboarding
 * terms screens beyond this update modal's selectors.
 * Related: onboarding/home flows that wait for this modal after login.
 *
 * @see ui/components/app/terms-of-use-popup/terms-of-use-popup.js
 */
class TermsOfUseUpdateModal {
  private readonly acceptButton = {
    testId: 'terms-of-use-agree-button',
  };

  private driver: Driver;

  private readonly popoverScrollButton = {
    testId: 'terms-of-use-scroll-button',
  };

  private readonly termsOfUseCheckbox = {
    testId: 'terms-of-use-checkbox',
  };

  private readonly termsOfUseModalTitle = {
    text: 'Review our Terms of Use',
    tag: 'h3',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
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

    try {
      await this.driver.clickElementAndWaitToDisappear(
        this.popoverScrollButton,
        5000,
      );
    } catch (e) {
      console.log('The scroll button did not disappear, continuing...');
    }

    // Checkbox stays disabled until scroll-to-bottom completes.
    // Wait for the checkbox to be enabled before clicking it.
    await this.driver.waitForSelector(this.termsOfUseCheckbox, {
      state: 'enabled',
    });
    const checkbox = await this.driver.findClickableElement(
      this.termsOfUseCheckbox,
    );
    await checkbox.click();

    // complete recovery flow takes time as multiple background requests are triggered
    // and can temporarily block the UI
    await this.driver.clickElementAndWaitToDisappear(this.acceptButton, 10000);
  }
}

export default TermsOfUseUpdateModal;
