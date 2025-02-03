import { Driver } from '../../webdriver/driver';
import { TEST_SNAPS_WEBSITE_URL } from '../../snaps/enums';
import { largeDelayMs, WINDOW_TITLES } from '../../helpers';

export class TestSnaps {
  driver: Driver;

  private readonly installedSnapsHeader = '[data-testid="InstalledSnaps"]';

  private readonly connectDialogsSnapButton =
    '[data-testid="dialogs"] [data-testid="connect-button"]';

  private readonly dialogsSnapConfirmationButton = '#sendConfirmationButton';

  private readonly dialogConnectButton = {
    text: 'Connect',
    tag: 'button',
    css: '[data-testid="page-container-footer-next"]',
  };

  private readonly dialogConfirmButton = {
    text: 'Confirm',
    tag: 'button',
    css: '[data-testid="page-container-footer-next"]',
  };

  private readonly dialogOkButton = {
    text: 'OK',
    tag: 'button',
    css: '[data-testid="page-container-footer-next"]',
  };

  private readonly connectHomePage = '#connecthomepage';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async openPage() {
    await this.driver.openNewPage(TEST_SNAPS_WEBSITE_URL);
    await this.driver.waitForSelector(this.installedSnapsHeader);
  }

  async clickConnectDialogsSnapButton() {
    await this.driver.scrollToElement(
      this.driver.findClickableElement(this.connectDialogsSnapButton),
    );
    await this.driver.delay(largeDelayMs);
    await this.driver.clickElement(this.connectDialogsSnapButton);
  }

  async clickDialogsSnapConfirmationButton() {
    await this.driver.clickElement(this.dialogsSnapConfirmationButton);
  }

  async completeSnapInstallConfirmation() {
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

    await this.driver.waitForSelector(this.dialogConnectButton);

    await this.driver.clickElement(this.dialogConnectButton);

    await this.driver.waitForSelector(this.dialogConfirmButton);

    await this.driver.clickElement(this.dialogConfirmButton);

    await this.driver.waitForSelector(this.dialogOkButton);

    await this.driver.clickElement(this.dialogOkButton);

    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
  }

  async clickConnectHomePage() {
    // find and scroll to the homepage snap
    const connectHomePageButton = await this.driver.findElement(
      this.connectHomePage,
    );
    await this.driver.scrollToElement(connectHomePageButton);

    // added delay for firefox
    await this.driver.delayFirefox(1000);

    // wait for and click connect
    await this.driver.waitForSelector(this.connectHomePage);
    await this.driver.clickElement(this.connectHomePage);
  }
}
