import { Driver } from '../../../webdriver/driver';

class NetworkSwitchAlertModal {
  driver: Driver;

  private readonly gotItButton = '[data-testid="alert-modal-button"]';

  private readonly showPendingConfirmationButton =
    '[data-testid="alert-modal-action-showPendingConfirmation"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.gotItButton,
        this.showPendingConfirmationButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for Network switch alert modal to be loaded',
        e,
      );
      throw e;
    }
    console.log('Network switch alert modal is loaded');
  }

  async clickGotItButton(): Promise<void> {
    console.log('Click got it button and wait for window to close');
    await this.driver.clickElementAndWaitForWindowToClose(this.gotItButton);
  }

  async clickShowPendingConfirmationButton(): Promise<void> {
    console.log('Click show pending confirmation button');
    await this.driver.clickElementAndWaitToDisappear(
      this.showPendingConfirmationButton,
    );
  }
}

export default NetworkSwitchAlertModal;
