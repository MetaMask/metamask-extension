import { Driver } from '../../../webdriver/driver';
import { regularDelayMs, veryLargeDelayMs } from '../../../helpers';

class SnapInstall {
  private driver: Driver;

  private readonly acceptThirdPartyNotice = {
    tag: 'button',
    text: 'Accept',
  };

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

  private readonly thirdPartyNoticeScrollButton = {
    testId: 'snap-privacy-warning-scroll',
  };

  private readonly snapUpdateScrollArea = '[data-testid="snap-update-scroll"]';

  private readonly approveButton = '[data-testid="confirmation-submit-button"]';

  public readonly lifeCycleHookMessageElement = '.snap-ui-renderer__panel';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkMessageResultSpan(
    spanSelectorId: string,
    expectedMessage: string,
  ) {
    console.log('Checking message result');
    await this.driver.waitForSelector({
      css: spanSelectorId,
      text: expectedMessage,
    });
  }

  async checkPageIsLoaded(): Promise<void> {
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

  async clickAcceptThirdPartyNotice() {
    // once all specs use FixtureBuilderV2, we can switch this method for clickElementAndWaitToDisappear (MMQA-1386)
    console.log('Clicking on the accept third party notice');
    await this.driver.clickElementSafe(this.acceptThirdPartyNotice);
    await this.driver.assertElementNotPresent(
      this.thirdPartyNoticeScrollButton,
      { waitAtLeastGuard: regularDelayMs },
    );
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

  async clickFooterConfirmButton() {
    console.log('Clicking Confirm button');
    await this.driver.clickElement(this.nextPageButton);
  }

  async clickScrollBottomThirdPartyNotice() {
    console.log('Clicking on the scroll bottom third party notice');
    // once all specs use FixtureBuilderV2, we can switch this method for clickElementAndWaitToDisappear (MMQA-1386)
    await this.driver.clickElementSafe(this.thirdPartyNoticeScrollButton);
    await this.driver.assertElementNotPresent(
      this.thirdPartyNoticeScrollButton,
      { waitAtLeastGuard: regularDelayMs },
    );
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
