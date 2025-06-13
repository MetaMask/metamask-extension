import { Driver } from '../../../webdriver/driver';
import { veryLargeDelayMs } from '../../../helpers';

class SnapInstall {
  private driver: Driver;

  private readonly addToMetaMaskHeader = {
    tag: 'h3',
    text: 'Add to MetaMask',
  };

  private readonly confirmButton = {
    tag: 'button',
    text: 'Confirm',
  };

  private readonly connectButton = {
    tag: 'button',
    text: 'Connect',
  };

  private readonly nextPageButton =
    '[data-testid="page-container-footer-next"]';

  private readonly okButton = {
    tag: 'button',
    text: 'OK',
  };

  private readonly pageFooter = '.page-container__footer';

  private readonly permissionConnect = '.permissions-connect';

  private readonly snapInstallScrollArea =
    '[data-testid="snap-install-scroll"]';

  private readonly snapUpdateScrollArea = '[data-testid="snap-update-scroll"]';

  private readonly approveButton = '[data-testid="confirmation-submit-button"]';

  public readonly lifeCycleHookMessageElement = '.snap-ui-renderer__panel';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_messageResultSpan(
    spanSelectorId: string,
    expectedMessage: string,
  ) {
    console.log('Checking message result');
    await this.driver.waitForSelector({
      css: spanSelectorId,
      text: expectedMessage,
    });
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.pageFooter,
        this.permissionConnect,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for Snap install dialog to be loaded',
        e,
      );
      throw e;
    }
    console.log('Snap install dialog is loaded');
  }

  async clickApproveButton() {
    console.log('Clicking the approve button');
    await this.driver.clickElement(this.approveButton);
  }

  async clickCheckboxPermission() {
    console.log('Clicking permission checkbox');
    await this.driver.clickElement(this.permissionConnect);
  }

  async clickConfirmButton() {
    console.log(
      'Clicking on the scroll button and then clicking the confirm button',
    );
    await this.driver.waitForSelector(this.addToMetaMaskHeader);
    await this.driver.clickElementSafe(this.snapInstallScrollArea);
    await this.driver.clickElement(this.confirmButton);
  }

  async clickConnectButton() {
    console.log('Clicking the connect button');
    await this.driver.clickElement(this.connectButton);
  }

  async clickOkButton() {
    console.log('Clicking Confirm/Ok button and wait for dialog to close');
    await this.driver.clickElementAndWaitForWindowToClose(this.okButton);
  }

  async clickOkButtonAndContinueOnDialog() {
    console.log(
      'Clicking Confirm/Ok button without waiting for the dialog to close',
    );
    await this.driver.clickElement(this.okButton);
  }

  async updateScrollAndClickConfirmButton() {
    console.log(
      'Clicking on the scroll button and then clicking the confirm button',
    );
    await this.driver.waitUntil(
      async () => {
        await this.driver.clickElementSafe(this.snapUpdateScrollArea);
        const element = await this.driver.findClickableElement(
          this.nextPageButton,
        );
        return Boolean(element);
      },
      { timeout: veryLargeDelayMs, interval: 100 },
    );
    await this.driver.clickElement(this.nextPageButton);
  }
}

export default SnapInstall;
