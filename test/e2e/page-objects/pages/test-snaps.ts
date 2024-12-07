import { Driver } from '../../webdriver/driver';
import { TEST_SNAPS_WEBSITE_URL } from '../../snaps/enums';
import { WINDOW_TITLES } from '../../helpers';

export class TestSnaps {
  driver: Driver;

  private readonly connectDialogsSnapButton =
    '[data-testid="dialogs"] [data-testid="connect-button"]';

  private readonly dialogsSnapConfirmationButton = '#sendConfirmationButton';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async openPage() {
    await this.driver.openNewPage(TEST_SNAPS_WEBSITE_URL);
    await this.driver.delay(1000);
  }

  async clickConnectDialogsSnapButton() {
    await this.driver.clickElement(this.connectDialogsSnapButton);
  }

  async clickDialogsSnapConfirmationButton() {
    await this.driver.clickElement(this.dialogsSnapConfirmationButton);
  }

  async completeSnapInstallConfirmation() {
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

    await this.driver.clickElement({
      text: 'Connect',
      tag: 'button',
    });

    await this.driver.clickElement({
      text: 'Confirm',
      tag: 'button',
    });

    await this.driver.clickElement({
      text: 'OK',
      tag: 'button',
    });

    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
  }
}
