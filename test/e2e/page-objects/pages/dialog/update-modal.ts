import { Driver } from '../../../webdriver/driver';
import { regularDelayMs } from '../../../helpers';

/**
 * Extension update announcement modal.
 *
 * Screen: modal layered over the home UI when an update announcement is shown
 * (`data-testid="update-modal"`).
 * Owns: presence/absence checks, close, and submit (which may briefly disrupt
 * the webdriver window handle count).
 * Boundaries: stops at the update modal. App reload / post-update home state
 * belongs to home page objects.
 * Related: `tests/update-modal/update-modal.spec.ts`, `HomePage`.
 *
 * @see ui/components/app/update-modal/update-modal.tsx
 */
class UpdateModal {
  private readonly closeButton = {
    testId: 'update-modal-close-button',
  };

  private driver: Driver;

  private readonly submitButton = {
    testId: 'update-modal-submit-button',
  };

  private readonly updateModal = {
    testId: 'update-modal',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded() {
    try {
      await this.driver.waitForSelector(this.updateModal);
    } catch (e) {
      console.log('Timeout while waiting for update modal to be loaded', e);
      throw e;
    }
    console.log('Update modal is loaded');
  }

  async checkPageIsNotPresent() {
    console.log('Checking if update modal is not present');
    await this.driver.assertElementNotPresent(this.updateModal, {
      waitAtLeastGuard: regularDelayMs,
    });
  }

  async close() {
    console.log('Click to close the update modal');
    await this.driver.clickElementAndWaitToDisappear(this.closeButton);
  }

  async confirm() {
    console.log('Click to confirm the update modal');
    await this.driver.clickElement(this.submitButton);
    // delay needed to mitigate a race condition where the tab is closed and re-opened after confirming, causing a brief disconnect with webdriver
    await this.driver.delay(3000);
    await this.driver.waitUntilXWindowHandles(1);
  }
}

export default UpdateModal;
