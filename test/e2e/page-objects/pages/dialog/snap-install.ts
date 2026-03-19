import { Driver } from '../../../webdriver/driver';
import { veryLargeDelayMs } from '../../../helpers';

class SnapInstall {
  private driver: Driver;

  private readonly addToMetaMaskHeader = {
    tag: 'h3',
    text: 'Add to MetaMask',
  };

  private readonly approveButton = '[data-testid="confirmation-submit-button"]';

  private readonly confirmButton = {
    tag: 'button',
    text: 'Confirm',
  };

  private readonly confirmFooterButton =
    '[data-testid="confirm-footer-button"]';

  private readonly confirmationDialogBoldUrl = {
    text: 'snaps.metamask.io',
    tag: 'b',
  };

  private readonly confirmationDialogLinkText = { text: 'That', tag: 'span' };

  private readonly connectButton = {
    tag: 'button',
    text: 'Connect',
  };

  private readonly connectionRequestHeader = {
    tag: 'h3',
    text: 'Connection request',
  };

  private readonly customDialogInput = '#custom-input';

  private readonly dialogApproveButton = { text: 'Approve', tag: 'button' };

  public readonly lifeCycleHookMessageElement = '.snap-ui-renderer__panel';

  private readonly nextPageButton =
    '[data-testid="page-container-footer-next"]';

  private readonly okButton = {
    tag: 'button',
    text: 'OK',
  };

  private readonly pageFooter = '.page-container__footer';

  private readonly permissionConnect = '.permissions-connect';

  private readonly promptInput = '.mm-input';

  private readonly scrollDownButton = '[aria-label="Scroll down"]';

  private readonly snapInstallScrollArea =
    '[data-testid="snap-install-scroll"]';

  private readonly snapUpdateScrollArea = '[data-testid="snap-update-scroll"]';

  private readonly snapsUiImage = '[data-testid="snaps-ui-image"]';

  private readonly visitSiteLink = { text: 'Visit site', tag: 'a' };

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

  async clickApproveButton() {
    console.log('Clicking the approve button');
    await this.driver.clickElement(this.approveButton);
  }

  async clickApproveButtonAndWaitForWindowToClose(): Promise<void> {
    await this.driver.clickElementAndWaitForWindowToClose(this.approveButton);
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

  async clickConfirmFooterAndWaitForClose(): Promise<void> {
    await this.driver.clickElementAndWaitForWindowToClose(
      this.confirmFooterButton,
    );
  }

  async clickConfirmationDialogLinkText(): Promise<void> {
    await this.driver.clickElement(this.confirmationDialogLinkText);
  }

  async clickConnectButton() {
    console.log('Clicking the connect button');
    await this.driver.waitForSelector(this.connectionRequestHeader);
    await this.driver.clickElement(this.connectButton);
  }

  async clickDialogApproveButton(): Promise<void> {
    await this.driver.clickElement(this.dialogApproveButton);
  }

  async clickDialogButtonAndWaitForClose(button: {
    text: string;
    tag: string;
  }): Promise<void> {
    await this.driver.clickElementAndWaitForWindowToClose(button);
  }

  async clickFooterConfirmButton() {
    console.log('Clicking Confirm button');
    await this.driver.clickElement(this.nextPageButton);
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

  async clickScrollDown(): Promise<void> {
    await this.driver.clickElementSafe(this.scrollDownButton);
  }

  async clickVisitSiteLink(): Promise<void> {
    await this.driver.clickElement(this.visitSiteLink);
  }

  async pasteIntoCustomDialogInput(value: string): Promise<void> {
    await this.driver.pasteIntoField(this.customDialogInput, value);
  }

  async pasteIntoPromptInput(value: string): Promise<void> {
    await this.driver.pasteIntoField(this.promptInput, value);
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

  async waitForConfirmationDialogLinkText(): Promise<void> {
    await this.driver.waitForSelector(this.confirmationDialogLinkText);
  }

  async waitForDialogApproveButton(): Promise<void> {
    await this.driver.waitForSelector(this.dialogApproveButton);
  }

  async waitForDialogPanelText(expectedText: string): Promise<void> {
    await this.driver.findScrollToAndClickElement(
      this.lifeCycleHookMessageElement,
    );
    await this.driver.waitForSelector({
      css: this.lifeCycleHookMessageElement,
      text: expectedText,
    });
  }

  async waitForSignatureInsightPanelText(expectedText: string): Promise<void> {
    await this.driver.waitForSelector({ text: expectedText, tag: 'p' });
  }

  async waitForSnapsUiImage(): Promise<void> {
    await this.driver.waitForSelector(this.snapsUiImage);
  }

  async waitForVisitSiteLinkContent(): Promise<void> {
    await this.driver.waitForSelector(this.confirmationDialogBoldUrl);
    await this.driver.waitForSelector(this.visitSiteLink);
  }
}

export default SnapInstall;
