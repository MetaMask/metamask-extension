import { Driver } from '../../../webdriver/driver';
import messages from '../../../../../app/_locales/en/messages.json';

class ExperimentalSettings {
  private readonly driver: Driver;

  // Locators
  private readonly addAccountSnapToggle =
    '[data-testid="add-account-snap-toggle-div"]';

  private readonly addBitcoinAccountToggle =
    '[data-testid="bitcoin-support-toggle-div"]';

  private readonly experimentalPageTitle = {
    text: 'Experimental',
    tag: 'h4',
  };

  private readonly redesignedSignatureToggle =
    '[data-testid="toggle-redesigned-confirmations-container"]';

  private readonly requestQueueToggle =
    '[data-testid="experimental-setting-toggle-request-queue"] label';

  private readonly watchAccountToggleState =
    '[data-testid="watch-account-toggle"]';

  private readonly watchAccountToggle =
    '[data-testid="watch-account-toggle-div"]';


  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.experimentalPageTitle);
    } catch (e) {
      console.log(
        'Timeout while waiting for Experimental Settings page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Experimental Settings page is loaded');
  }

  // Get the state of the Watch Account Toggle, returns true if the toggle is selected
  async getWatchAccountToggleState(): Promise<boolean> {
    console.log('Get Watch Account Toggle State');
    const toggleInput = await this.driver.findElement(
      this.watchAccountToggleState,
    );
    return toggleInput.isSelected();
  }

  async toggleBitcoinAccount(): Promise<void> {
    console.log('Toggle Add new Bitcoin account on experimental setting page');
    await this.driver.waitForSelector({
      text: messages.bitcoinSupportToggleTitle.message,
      tag: 'span',
    });
    await this.driver.clickElement(this.addBitcoinAccountToggle);
  }

  async toggleAddAccountSnap(): Promise<void> {
    console.log('Toggle Add Account Snap on experimental setting page');
    await this.driver.clickElement(this.addAccountSnapToggle);
  }

  async toggleRedesignedSignature(): Promise<void> {
    console.log('Toggle Redesigned Signature on experimental setting page');
    await this.driver.clickElement(this.redesignedSignatureToggle);
  }

  async toggleRequestQueue(): Promise<void> {
    console.log('Toggle Request Queue on experimental setting page');
    await this.driver.clickElement(this.requestQueueToggle);
  }

  async toggleWatchAccount(): Promise<void> {
    console.log('Toggle Watch Account on experimental setting page');
    await this.driver.clickElement(this.watchAccountToggle);
  }
}

export default ExperimentalSettings;
