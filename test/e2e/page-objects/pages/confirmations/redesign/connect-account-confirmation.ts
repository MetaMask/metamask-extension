import { Driver } from '../../../../webdriver/driver';

class ConnectAccountConfirmation {
  driver: Driver;

  private readonly addSolanaAccountButton = {
    testId: 'submit-add-account-with-name',
  };

  private readonly cancelConnectButton = {
    testId: 'cancel-btn',
  };

  private readonly confirmConnectButton = {
    testId: 'confirm-btn',
  };

  private readonly connectAccountConfirmationButton = {
    text: 'Connect',
    tag: 'button',
  };

  private readonly connectAccountConfirmationTitle = {
    text: 'Connect this website with MetaMask',
    tag: 'p',
  };

  private readonly createSolanaAccountModalButton = {
    testId: 'create-solana-account',
  };

  private readonly editAccountButton = {
    text: 'Edit accounts',
    tag: 'button',
  };

  private readonly editPermissionsButton = '[data-testid="edit"]';

  private readonly permissionsTab = {
    testId: 'permissions-tab',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.connectAccountConfirmationTitle,
        this.connectAccountConfirmationButton,
      ]);
    } catch (e) {
      console.log(
        `Timeout while waiting for Connect Account confirmation page to be loaded`,
        e,
      );
      throw e;
    }
    console.log(`Connect Account confirmation page is loaded`);
  }

  async cancelConnect(): Promise<void> {
    console.log('Cancel connection on Connect Account confirmation page');
    await this.driver.clickElementAndWaitForWindowToClose(
      this.cancelConnectButton,
    );
  }

  async confirmConnect(): Promise<void> {
    console.log('Confirm connection on Connect Account confirmation page');
    await this.driver.clickElementAndWaitForWindowToClose(
      this.connectAccountConfirmationButton,
    );
  }

  async goToPermissionsTab(): Promise<void> {
    await this.driver.clickElement(this.permissionsTab);
  }

  async openEditAccountsModal(): Promise<void> {
    console.log('Open edit accounts modal');
    await this.driver.clickElement(this.editAccountButton);
  }

  async openEditNetworksModal(): Promise<void> {
    console.log('Open edit networks modal');
    const editButtons = await this.driver.findElements(
      this.editPermissionsButton,
    );
    await editButtons[1].click();
  }

  async createCreateSolanaAccountFromModal(): Promise<void> {
    console.log('Create Solana account from modal');
    const createSolanaAccountModalButton = await this.driver.findElement(
      this.createSolanaAccountModalButton,
    );
    await createSolanaAccountModalButton.click();

    const addSolanaAccountButton = await this.driver.findClickableElement(
      this.addSolanaAccountButton,
      {
        timeout: 1000,
      },
    );
    await addSolanaAccountButton.click();
  }

  async isCreateSolanaAccountModalButtonVisible(): Promise<boolean> {
    try {
      await this.driver.findClickableElement(
        this.createSolanaAccountModalButton,
        {
          timeout: 1000,
        },
      );
    } catch (e) {
      console.log('Create Solana account button not enabled', e);
      return false;
    }
    console.log('Create Solana account button is enabled');
    return true;
  }

  async isConfirmButtonEnabled(): Promise<boolean> {
    try {
      await this.driver.findClickableElement(this.confirmConnectButton, {
        timeout: 1000,
      });
    } catch (e) {
      console.log('Confirm button not enabled', e);
      return false;
    }
    console.log('Confirm button is enabled');
    return true;
  }
}

export default ConnectAccountConfirmation;
