import { Driver } from '../../webdriver/driver';
import { WINDOW_TITLES } from '../../constants';
import { getCleanAppState, regularDelayMs } from '../../helpers';

const SIMPLE_KEYRING_SNAP_ID = 'npm:@metamask/snap-simple-keyring-snap';

class SnapSimpleKeyringPage {
  private readonly driver: Driver;

  private readonly accountCreatedMessage = {
    text: 'Account created',
    tag: 'h3',
  };

  private readonly addtoMetamaskMessage = {
    text: 'Add to MetaMask',
    tag: 'h3',
  };

  private readonly approveRequestButton = {
    text: 'Approve Request',
    tag: 'button',
  };

  private readonly approveRequestIdInput = '#approve-request-request-id';

  private readonly approveRequestSection = {
    text: 'Approve request',
    tag: 'div',
  };

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

  private readonly installationCompleteMessage = {
    text: 'Installation complete',
    tag: 'h2',
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
   * Approves or rejects a transaction from a snap account on Snap Simple Keyring page.
   *
   * @param approveTransaction - Indicates if the transaction should be approved. Defaults to true.
   * @param isSignatureRequest - Indicates if the request is a signature request. Defaults to false.
   */
  async approveRejectSnapAccountTransaction(
    approveTransaction: boolean = true,
    isSignatureRequest: boolean = false,
  ): Promise<void> {
    console.log(
      'Approve/Reject snap account transaction on Snap Simple Keyring page',
    );

    await this.driver.delay(regularDelayMs);

    if (isSignatureRequest) {
      await this.driver.clickElementAndWaitForWindowToClose(
        this.confirmationSubmitButton,
      );
    } else {
      // For send eth requests, the origin screen is not closed automatically, so we cannot call clickElementAndWaitForWindowToClose here.
      await this.driver.clickElementAndWaitToDisappear(
        this.confirmationSubmitButton,
      );
    }
    await this.driver.switchToWindowWithTitle(
      WINDOW_TITLES.SnapSimpleKeyringDapp,
    );

    // Get the first request from the requests list on simple keyring snap page
    await this.driver.clickElementUsingMouseMove(this.listRequestsSection);
    await this.driver.clickElement(this.listRequestsButton);
    const requestJSON = await (
      await this.driver.waitForSelector(this.requestMessage)
    ).getText();

    if (approveTransaction) {
      console.log(
        'Approve snap account transaction on Snap Simple Keyring page',
      );
      await this.driver.clickElementUsingMouseMove(this.approveRequestSection);
      await this.driver.fill(
        this.approveRequestIdInput,
        JSON.parse(requestJSON)[0].id,
      );
      await this.driver.clickElement(this.approveRequestButton);
    } else {
      console.log(
        'Reject snap account transaction on Snap Simple Keyring page',
      );
      await this.driver.clickElementUsingMouseMove(this.rejectRequestSection);
      await this.driver.fill(
        this.rejectRequestIdInput,
        JSON.parse(requestJSON)[0].id,
      );
      await this.driver.clickElement(this.rejectRequestButton);
    }
    await this.driver.switchToWindowWithTitle(
      WINDOW_TITLES.ExtensionInFullScreenView,
    );
  }

  async cancelCreateSnapOnConfirmationScreen(): Promise<void> {
    console.log('Cancel create snap on confirmation screen');
    await this.driver.clickElementAndWaitForWindowToClose(
      this.confirmationCancelButton,
    );
  }

  async confirmCreateSnapOnConfirmationScreen(): Promise<void> {
    console.log('Confirm create snap on confirmation screen');
    await this.driver.clickElement(this.confirmationSubmitButton);
  }

  /**
   * Snap Simple Keyring accounts persisted in AccountsController.
   *
   * @param state - Extension UI state from `getCleanAppState`.
   * @returns Matching internal accounts for the Simple Keyring snap.
   */
  private getSnapSimpleKeyringAccountsFromState(
    state: Awaited<ReturnType<typeof getCleanAppState>>,
  ): { address: string }[] {
    const accounts = Object.values(
      (
        state?.metamask as {
          // eslint-disable-next-line @typescript-eslint/naming-convention -- controller state key
          AccountsController?: {
            internalAccounts?: {
              accounts?: Record<
                string,
                {
                  address?: string;
                  metadata?: {
                    keyring?: { type?: string };
                    snap?: { id?: string };
                  };
                }
              >;
            };
          };
        }
      )?.AccountsController?.internalAccounts?.accounts ?? {},
    );
    return accounts.filter(
      (account): account is { address: string } =>
        account?.metadata?.keyring?.type === 'Snap Keyring' &&
        account?.metadata?.snap?.id === SIMPLE_KEYRING_SNAP_ID &&
        typeof account.address === 'string',
    );
  }

  /**
   * Returns how many Simple Keyring snap accounts exist in extension state.
   */
  private async getSnapSimpleKeyringAccountCount(): Promise<number> {
    await this.driver.switchToWindowWithTitle(
      WINDOW_TITLES.ExtensionInFullScreenView,
    );
    const state = await getCleanAppState(this.driver);
    return this.getSnapSimpleKeyringAccountsFromState(state).length;
  }

  /**
   * Waits for account creation to complete. Prefer extension state; fall back to
   * the companion dapp JSON response when it appears first.
   *
   * @param previousAccountCount - Snap account count before create/import.
   * @returns Address of the newly created snap account, when applicable.
   */
  private async waitForSnapAccountCreationComplete(
    previousAccountCount: number,
  ): Promise<string> {
    await this.driver.switchToWindowWithTitle(
      WINDOW_TITLES.ExtensionInFullScreenView,
    );

    let newAddress = '';
    await this.driver.waitUntil(
      async () => {
        const state = await getCleanAppState(this.driver);
        const extensionAccounts =
          this.getSnapSimpleKeyringAccountsFromState(state);
        if (extensionAccounts.length > previousAccountCount) {
          newAddress = extensionAccounts[extensionAccounts.length - 1].address;
          return true;
        }

        await this.driver.switchToWindowWithTitle(
          WINDOW_TITLES.SnapSimpleKeyringDapp,
        );
        try {
          const jsonMessage = await this.driver.findElement(
            this.newAccountMessage,
          );
          const parsed = JSON.parse(await jsonMessage.getText()) as {
            address?: string;
          };
          if (typeof parsed.address === 'string') {
            newAddress = parsed.address;
            return true;
          }
        } catch {
          // Dapp RPC response not rendered yet; keep polling extension state.
        }

        await this.driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        return false;
      },
      { interval: regularDelayMs, timeout: 45000 },
    );

    return newAddress;
  }

  /**
   * Creates a new account on the Snap Simple Keyring page and checks the account is created.
   *
   * @param isFirstAccount - Indicates if this is the first snap account being created. Defaults to true.
   * @returns the public key of the new created account
   */
  async createNewAccount(isFirstAccount: boolean = true): Promise<string> {
    console.log('Create new account on Snap Simple Keyring page');
    const previousAccountCount = await this.getSnapSimpleKeyringAccountCount();
    await this.driver.switchToWindowWithTitle(
      WINDOW_TITLES.SnapSimpleKeyringDapp,
    );
    await this.openCreateSnapAccountConfirmationScreen(isFirstAccount);
    await this.confirmCreateSnapOnConfirmationScreen();

    // Wait for account creation to complete and success message
    await this.driver.waitForSelector(this.accountCreatedMessage);
    await this.driver.clickElementAndWaitForWindowToClose(
      this.confirmationSubmitButton,
    );

    return this.waitForSnapAccountCreationComplete(previousAccountCount);
  }

  /**
   * Imports an account with a private key on Snap Simple Keyring page.
   *
   * @param privateKey - The private key to import.
   */
  async importAccountWithPrivateKey(privateKey: string): Promise<void> {
    console.log('Import account with private key on Snap Simple Keyring page');
    const previousAccountCount = await this.getSnapSimpleKeyringAccountCount();
    await this.driver.switchToWindowWithTitle(
      WINDOW_TITLES.SnapSimpleKeyringDapp,
    );
    await this.driver.clickElement(this.importAccountSection);
    await this.driver.fill(this.importAccountPrivateKeyInput, privateKey);
    await this.driver.clickElement(this.importAccountButton);
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await this.confirmCreateSnapOnConfirmationScreen();

    // Wait for account creation to complete
    await this.driver.waitForSelector(this.accountCreatedMessage);
    await this.driver.clickElementAndWaitForWindowToClose(
      this.confirmationSubmitButton,
    );

    await this.waitForSnapAccountCreationComplete(previousAccountCount);
  }

  /**
   * Installs the Simple Keyring Snap and checks the snap is connected.
   */
  async installSnap(): Promise<void> {
    console.log('Install Simple Keyring Snap');
    await this.driver.clickElement(this.connectButton);

    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await this.driver.clickElement(this.confirmConnectionButton);

    // set a bigger timeout to wait for element as a temporary fix to reduce flakiness
    await this.driver.waitForSelector(this.addtoMetamaskMessage, {
      timeout: 15000,
    });
    await this.driver.clickElementSafe(this.snapInstallScrollButton, 200);
    await this.driver.waitForSelector(this.confirmAddtoMetamask);
    await this.driver.clickElement(this.confirmAddtoMetamask);

    await this.driver.waitForSelector(this.installationCompleteMessage);
    await this.checkSnapIsReady();
    await this.driver.clickElementAndWaitForWindowToClose(
      this.confirmCompleteButton,
    );

    await this.driver.switchToWindowWithTitle(
      WINDOW_TITLES.SnapSimpleKeyringDapp,
    );
    await this.checkSimpleKeyringSnapConnected();
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
   * Waits until the Simple Keyring Snap has finished installing in the
   * extension background state and is ready to handle keyring requests.
   *
   */
  async checkSnapIsReady(): Promise<void> {
    console.log('Wait for Simple Keyring Snap to be ready');
    await this.driver.switchToWindowWithTitle(
      WINDOW_TITLES.ExtensionInFullScreenView,
    );
    await this.driver.waitUntil(
      async () => {
        const state = await getCleanAppState(this.driver);
        const snap = state?.metamask?.snaps?.[SIMPLE_KEYRING_SNAP_ID];
        return Boolean(snap?.enabled && snap.status !== 'installing');
      },
      { interval: regularDelayMs, timeout: 10000 },
    );
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  }
}

export default SnapSimpleKeyringPage;
