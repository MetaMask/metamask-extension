import { Driver } from '../../webdriver/driver';

/**
 * Page object for the Snap Simple Keyring Dapp page.
 * This handles interactions on the dapp page only - dialog interactions
 * should use the appropriate dialog page objects.
 */
class SnapSimpleKeyringPage {
  private readonly driver: Driver;

  private readonly approveRequestButton = {
    text: 'Approve Request',
    tag: 'button',
  };

  private readonly approveRequestIdInput = '#approve-request-request-id';

  private readonly approveRequestSection = {
    text: 'Approve request',
    tag: 'div',
  };

  private readonly connectButton = '#connectButton';

  private readonly createAccountButton = {
    text: 'Create Account',
    tag: 'button',
  };

  private readonly createAccountSection = {
    text: 'Create account',
    tag: 'div',
  };

  private readonly errorRequestMessage = {
    text: 'Error request',
    tag: 'p',
  };

  private readonly importAccountButton = {
    text: 'Import Account',
    tag: 'button',
  };

  private readonly importAccountPrivateKeyInput = '#import-account-private-key';

  private readonly importAccountSection = {
    text: 'Import account',
    tag: 'div',
  };

  private readonly listRequestsButton = {
    text: 'List Requests',
    tag: 'button',
  };

  private readonly listRequestsSection = {
    text: 'List requests',
    tag: 'div',
  };

  private readonly newAccountMessage = {
    text: '"address":',
    tag: 'div',
  };

  private readonly pageTitle = {
    text: 'Snap Simple Keyring',
    tag: 'p',
  };

  private readonly rejectRequestButton = {
    text: 'Reject Request',
    tag: 'button',
  };

  private readonly rejectRequestIdInput = '#reject-request-request-id';

  private readonly rejectRequestSection = {
    text: 'Reject request',
    tag: 'div',
  };

  private readonly requestMessage = {
    text: '"scope":',
    tag: 'div',
  };

  private readonly snapConnectedMessage = '#snapConnected';

  private readonly snapInstallScrollButton =
    '[data-testid="snap-install-scroll"]';

  private readonly useSyncApprovalToggle =
    '[data-testid="use-sync-flow-toggle"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
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

  /**
   * Clicks connect button to initiate snap installation.
   * After calling this, switch to the dialog window to complete installation.
   */
  async clickConnectButton(): Promise<void> {
    console.log('Clicking connect button on Snap Simple Keyring page');
    await this.driver.clickElement(this.connectButton);
  }

  /**
   * Opens the create account section and clicks the create account button.
   * After calling this, switch to the dialog window to complete account creation.
   *
   * @param isFirstAccount - Whether this is the first account being created. Defaults to true.
   */
  async clickCreateAccount(isFirstAccount: boolean = true): Promise<void> {
    console.log('Clicking create account on Snap Simple Keyring page');
    if (isFirstAccount) {
      await this.driver.clickElement(this.createAccountSection);
    }
    await this.driver.clickElement(this.createAccountButton);
  }

  /**
   * Opens the import account section, fills the private key, and clicks import.
   * After calling this, switch to the dialog window to complete account import.
   *
   * @param privateKey - The private key to import.
   */
  async fillAndClickImportAccount(privateKey: string): Promise<void> {
    console.log(
      'Filling and clicking import account on Snap Simple Keyring page',
    );
    await this.driver.clickElement(this.importAccountSection);
    await this.driver.fill(this.importAccountPrivateKeyInput, privateKey);
    await this.driver.clickElement(this.importAccountButton);
  }

  /**
   * Gets the first pending request ID from the requests list.
   *
   * @returns The request ID string.
   */
  async getFirstPendingRequestId(): Promise<string> {
    console.log('Getting first pending request ID');
    await this.driver.clickElementUsingMouseMove(this.listRequestsSection);
    await this.driver.clickElement(this.listRequestsButton);
    const requestJSON = await (
      await this.driver.waitForSelector(this.requestMessage)
    ).getText();
    return JSON.parse(requestJSON)[0].id;
  }

  /**
   * Approves a request with the given ID.
   *
   * @param requestId - The ID of the request to approve.
   */
  async approveRequest(requestId: string): Promise<void> {
    console.log(`Approving request with ID: ${requestId}`);
    await this.driver.clickElementUsingMouseMove(this.approveRequestSection);
    await this.driver.fill(this.approveRequestIdInput, requestId);
    await this.driver.clickElement(this.approveRequestButton);
  }

  /**
   * Rejects a request with the given ID.
   *
   * @param requestId - The ID of the request to reject.
   */
  async rejectRequest(requestId: string): Promise<void> {
    console.log(`Rejecting request with ID: ${requestId}`);
    await this.driver.clickElementUsingMouseMove(this.rejectRequestSection);
    await this.driver.fill(this.rejectRequestIdInput, requestId);
    await this.driver.clickElement(this.rejectRequestButton);
  }

  async toggleUseSyncApproval(): Promise<void> {
    console.log('Toggle Use Synchronous Approval');
    await this.driver.clickElement(this.useSyncApprovalToggle);
  }

  async checkErrorRequestMessageDisplayed(): Promise<void> {
    console.log(
      'Check error request message is displayed on snap simple keyring page',
    );
    await this.driver.waitForSelector(this.errorRequestMessage);
  }

  async checkSimpleKeyringSnapConnected(): Promise<void> {
    console.log('Check simple keyring snap is connected');
    await this.driver.waitForSelector(this.snapConnectedMessage);
  }

  /**
   * Checks that a new account message with address is displayed.
   *
   * @returns The address of the newly created account.
   */
  async getNewAccountAddress(): Promise<string> {
    console.log('Getting new account address from Snap Simple Keyring page');
    const newAccountJSONMessage = await (
      await this.driver.waitForSelector(this.newAccountMessage)
    ).getText();
    return JSON.parse(newAccountJSONMessage).address;
  }
}

export default SnapSimpleKeyringPage;
