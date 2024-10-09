import { Driver } from '../../webdriver/driver';
import { WINDOW_TITLES } from '../../helpers';

class SnapSimpleKeyringPage {
  private readonly driver: Driver;

  private readonly accountCreatedMessage = {
    text: 'Account created',
    tag: 'h3',
  };

  private readonly accountSupportedMethods = {
    text: 'Account Supported Methods',
    tag: 'p',
  };

  private readonly addtoMetamaskMessage = {
    text: 'Add to MetaMask',
    tag: 'h3',
  };

  private readonly cancelAddAccountWithNameButton =
    '[data-testid="cancel-add-account-with-name"]';

  private readonly confirmAddtoMetamask = {
    text: 'Confirm',
    tag: 'button',
  };

  private readonly confirmationCancelButton =
    '[data-testid="confirmation-cancel-button"]';

  private readonly confirmationSubmitButton =
    '[data-testid="confirmation-submit-button"]';

  private readonly confirmCompleteButton = {
    text: 'OK',
    tag: 'button',
  };

  private readonly confirmConnectionButton = {
    text: 'Connect',
    tag: 'button',
  };

  private readonly connectButton = '#connectButton';

  private readonly createAccountButton = {
    text: 'Create Account',
    tag: 'button',
  };

  private readonly createAccountMessage =
    '[data-testid="create-snap-account-content-title"]';

  private readonly createAccountSection = {
    text: 'Create account',
    tag: 'div',
  };

  private readonly createSnapAccountName = '#account-name';

  private readonly errorRequestMessage = {
    text: 'Error request',
    tag: 'p',
  };

  private readonly installationCompleteMessage = {
    text: 'Installation complete',
    tag: 'h2',
  };

  private readonly pageTitle = {
    text: 'Snap Simple Keyring',
    tag: 'p',
  };

  private readonly snapConnectedMessage = '#snapConnected';

  private readonly snapInstallScrollButton =
    '[data-testid="snap-install-scroll"]';

  private readonly submitAddAccountWithNameButton =
    '[data-testid="submit-add-account-with-name"]';

  private readonly useSyncApprovalToggle =
    '[data-testid="use-sync-flow-toggle"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.pageTitle,
        this.useSyncApprovalToggle,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for Snap Simple Keyring page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Snap Simple Keyring page is loaded');
  }

  async cancelCreateSnapOnConfirmationScreen(): Promise<void> {
    console.log('Cancel create snap on confirmation screen');
    await this.driver.clickElementAndWaitForWindowToClose(
      this.confirmationCancelButton,
    );
  }

  async cancelCreateSnapOnFillNameScreen(): Promise<void> {
    console.log('Cancel create snap on fill name screen');
    await this.driver.clickElementAndWaitForWindowToClose(
      this.cancelAddAccountWithNameButton,
    );
  }

  async confirmCreateSnapOnConfirmationScreen(): Promise<void> {
    console.log('Confirm create snap on confirmation screen');
    await this.driver.clickElement(this.confirmationSubmitButton);
  }

  /**
   * Creates a new account on the Snap Simple Keyring page and checks the account is created.
   *
   * @param accountName - Optional: name for the snap account. Defaults to "SSK Account".
   * @param isFirstAccount - Indicates if this is the first snap account being created. Defaults to true.
   */
  async createNewAccount(
    accountName: string = 'SSK Account',
    isFirstAccount: boolean = true,
  ): Promise<void> {
    console.log('Create new account on Snap Simple Keyring page');
    await this.openCreateSnapAccountConfirmationScreen(isFirstAccount);
    await this.confirmCreateSnapOnConfirmationScreen();

    await this.driver.waitForSelector(this.createSnapAccountName);
    await this.driver.fill(this.createSnapAccountName, accountName);
    await this.driver.clickElement(this.submitAddAccountWithNameButton);

    await this.driver.waitForSelector(this.accountCreatedMessage);
    await this.driver.clickElementAndWaitForWindowToClose(
      this.confirmationSubmitButton,
    );
    await this.driver.switchToWindowWithTitle(
      WINDOW_TITLES.SnapSimpleKeyringDapp,
    );
    await this.check_accountSupportedMethodsDisplayed();
  }

  /**
   * Installs the Simple Keyring Snap and checks the snap is connected.
   */
  async installSnap(): Promise<void> {
    console.log('Install Simple Keyring Snap');
    await this.driver.clickElement(this.connectButton);

    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await this.driver.clickElement(this.confirmConnectionButton);

    await this.driver.waitForSelector(this.addtoMetamaskMessage);
    await this.driver.clickElementSafe(this.snapInstallScrollButton, 200);
    await this.driver.waitForSelector(this.confirmAddtoMetamask);
    await this.driver.clickElement(this.confirmAddtoMetamask);

    await this.driver.waitForSelector(this.installationCompleteMessage);
    await this.driver.clickElementAndWaitForWindowToClose(
      this.confirmCompleteButton,
    );

    await this.driver.switchToWindowWithTitle(
      WINDOW_TITLES.SnapSimpleKeyringDapp,
    );
    await this.check_simpleKeyringSnapConnected();
  }

  /**
   * Opens the create snap account confirmation screen.
   *
   * @param isFirstAccount - Indicates if this is the first snap account being created. Defaults to true.
   */
  async openCreateSnapAccountConfirmationScreen(
    isFirstAccount: boolean = true,
  ): Promise<void> {
    console.log('Open create snap account confirmation screen');
    if (isFirstAccount) {
      await this.driver.clickElement(this.createAccountSection);
    }
    await this.driver.clickElement(this.createAccountButton);

    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await this.driver.waitForSelector(this.createAccountMessage);
    await this.driver.waitForSelector(this.confirmationCancelButton);
  }

  async toggleUseSyncApproval() {
    console.log('Toggle Use Synchronous Approval');
    await this.driver.clickElement(this.useSyncApprovalToggle);
  }

  async check_accountSupportedMethodsDisplayed(): Promise<void> {
    console.log(
      'Check new created account supported methods are displayed on simple keyring snap page',
    );
    await this.driver.waitForSelector(this.accountSupportedMethods);
  }

  async check_errorRequestMessageDisplayed(): Promise<void> {
    console.log(
      'Check error request message is displayed on snap simple keyring page',
    );
    await this.driver.waitForSelector(this.errorRequestMessage);
  }

  async check_simpleKeyringSnapConnected(): Promise<void> {
    console.log('Check simple keyring snap is connected');
    await this.driver.waitForSelector(this.snapConnectedMessage);
  }
}

export default SnapSimpleKeyringPage;
