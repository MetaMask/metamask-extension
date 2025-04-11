import { Driver } from '../../../webdriver/driver';
import { veryLargeDelayMs } from '../../../helpers';

class SnapInstall {
  private driver: Driver;

  private readonly nextPageButton =
    '[data-testid="page-container-footer-next"]';

  private readonly pageFooter = '.page-container__footer';

  private readonly permissionConnect = '.permissions-connect';

  private readonly snapInstallScrollArea =
    '[data-testid="snap-install-scroll"]';

  private readonly snapUpdateScrollArea = '[data-testid="snap-update-scroll"]';

  private readonly approveButton = '[data-testid="confirmation-submit-button"]';

  private readonly connectButton = '[data-testid="confirm-btn"]';

  public readonly lifeCycleHookMessageElement = '.snap-ui-renderer__panel';

  private readonly insightTitle = {
    text: 'Insights Example Snap',
    tag: 'span',
  };

  constructor(driver: Driver) {
    this.driver = driver;
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

  async clickCheckboxPermission() {
    console.log('Clicking permission checkbox');
    await this.driver.clickElement(this.permissionConnect);
  }

  async clickNextButton() {
    console.log('Clicking Confirm/Ok button');
    await this.driver.clickElement(this.nextPageButton);
  }

  async waitForNextButton() {
    console.log('Waiting for Confirm/Ok button to load');
    await this.driver.waitForSelector(this.nextPageButton);
  }

  async clickConfirmButton() {
    console.log(
      'Clicking on the scroll button and then clicking the confirm button',
    );
    await this.driver.waitUntil(
      async () => {
        await this.driver.clickElementSafe(this.snapInstallScrollArea);
        const isEnabled = await this.driver.findClickableElement(
          this.nextPageButton,
        );
        return isEnabled;
      },
      { timeout: veryLargeDelayMs, interval: 100 },
    );
    await this.driver.clickElement(this.nextPageButton);
  }

  async updateScrollAndClickConfirmButton() {
    console.log(
      'Clicking on the scroll button and then  clicking the confirm button',
    );
    await this.driver.waitUntil(
      async () => {
        await this.driver.clickElementSafe(this.snapUpdateScrollArea);
        const isEnabled = await this.driver.findClickableElement(
          this.nextPageButton,
        );
        return isEnabled;
      },
      { timeout: veryLargeDelayMs, interval: 100 },
    );
    await this.driver.clickElement(this.nextPageButton);
  }

  async clickApproveButton() {
    console.log('Clicking the approve button');
    await this.driver.clickElement(this.approveButton);
  }

  async clickConnectButton() {
    console.log('Clicking the connect button');
    await this.driver.clickElement(this.connectButton);
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
}

export default SnapInstall;
