import { Driver } from '../../webdriver/driver';
import { WINDOW_TITLES } from '../../helpers';

class SnapSimpleKeyringPage {
  private readonly driver: Driver;

  private readonly connectButton = '#connectButton';
  private readonly confirmConnectionButton = {
    text: 'Connect',
    tag: 'button',
  };
  private readonly confirmAddtoMetamask = {
    text: 'Confirm',
    tag: 'button',
  };
  private readonly confirmCompleteButton = {
    text: 'OK',
    tag: 'button',
  };
  private readonly pageTitle = {
    text: 'Snap Simple Keyring',
    tag: 'p',
  };
  private readonly createAccountSection =
  {
    text: 'Create account',
    tag: 'div',
  };
  private readonly createAccountButton =
  {
    text: 'Create Account',
    tag: 'button',
  };
  private readonly accountCreatedMessage =
  {
    text: 'Account created',
    tag: 'h3',
  };
  private readonly newPublicKey =
  {
    text: '0x',
    tag: 'p',
  };
  private readonly useSyncApprovalToggle = '[data-testid="use-sync-flow-toggle"]';
  private readonly addtoMetamaskMessage = { text: 'Add to MetaMask', tag: 'h3' };
  private readonly installationCompleteMessage = { text: 'Installation complete', tag: 'h2' };
  private readonly snapConnectedMessage = '#snapConnected';
  private readonly createAccountMessage = '[data-testid="create-snap-account-content-title"]';
  private readonly confirmCreateAccountButton = '[data-testid="use-sync-flow-toggle"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector([
        this.pageTitle,
        this.useSyncApprovalToggle,
      ]);
    } catch (e) {
      console.log('Timeout while waiting for Snap Simple Keyring page to be loaded', e);
      throw e;
    }
    console.log('Snap Simple Keyring page is loaded');
  }

  async createNewAccount(): Promise<void> {
    console.log('Create new account on Snap Simple Keyring page');
    await this.driver.clickElement(this.createAccountSection);
    await this.driver.clickElement(this.createAccountButton);

    await this.driver.waitUntilXWindowHandles(3);
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await this.driver.waitForSelector(this.createAccountMessage);
    await this.driver.clickElement(this.confirmCreateAccountButton);

    await this.driver.waitForSelector(this.accountCreatedMessage);
    await this.driver.clickElement(this.confirmCompleteButton);
    await this.driver.waitUntilXWindowHandles(2);
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.SnapSimpleKeyringDapp);
    await this.check_newPublickKeyIsDisplayed();
  }

  async installSnap(): Promise<void> {
    console.log('Install Simple Keyring Snap');
    await this.driver.clickElement(this.connectButton);

    await this.driver.waitUntilXWindowHandles(3);
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await this.driver.clickElement(this.confirmConnectionButton);

    await this.driver.waitForSelector(this.addtoMetamaskMessage);
    await this.driver.clickElement(this.confirmAddtoMetamask);

    await this.driver.waitForSelector(this.installationCompleteMessage);
    await this.driver.clickElementAndWaitToDisappear(this.confirmCompleteButton);

    await this.driver.waitUntilXWindowHandles(2);
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.SnapSimpleKeyringDapp);
    await this.check_simpleKeyringSnapConnected();
  }

  async toggleUseSyncApproval() {
    console.log('Toggle Use Synchronous Approval');
    await this.driver.clickElement(this.useSyncApprovalToggle);
  }

  async check_simpleKeyringSnapConnected(): Promise<void> {
    console.log('Check simple keyring snap is connected');
    await this.driver.waitForSelector(this.snapConnectedMessage);
  }

  async check_newPublickKeyIsDisplayed(): Promise<void> {
    console.log('Check new publick key is displayed on simple keyring snap page');
    await this.driver.waitForSelector(this.newPublicKey);
  }


}

export default SnapSimpleKeyringPage;
