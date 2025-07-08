import { Driver } from '../../../webdriver/driver';

/**
 * Represents the site permission page.
 * This page allows users to view and manage permissions for a connected site.
 */
class SitePermissionPage {
  private driver: Driver;

  private readonly confirmDisconnectButton = '[data-testid="disconnect-all"]';

  private readonly confirmEditAccountsButton =
    '[data-testid="connect-more-accounts-button"]';

  private readonly confirmEditNetworksButton =
    '[data-testid="connect-more-chains-button"]';

  private readonly connectedAccountsInfo = {
    text: 'See your accounts and suggest transactions',
    tag: 'p',
  };

  private readonly disconnectButton = '[data-test-id="disconnect-all"]';

  private readonly disconnectConfirmMessage = {
    text: 'MetaMask isn’t connected to this site',
    tag: 'p',
  };

  private readonly disconnectModalTitle = {
    text: 'Disconnect',
    tag: 'h4',
  };

  private readonly editAccountsModalTitle = {
    text: 'Edit accounts',
    tag: 'h4',
  };

  private readonly editButton = '[data-testid="edit"]';

  private readonly editNetworksModalTitle = {
    text: 'Edit networks',
    tag: 'h4',
  };

  private readonly enabledNetworksInfo = {
    text: 'Use your enabled networks',
    tag: 'p',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Check if site permission page is loaded
   *
   * @param site - Site to check
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_pageIsLoaded(site: string): Promise<void> {
    try {
      await this.driver.waitForSelector(this.connectedAccountsInfo);
      await this.driver.waitForSelector(this.enabledNetworksInfo);
      await this.driver.waitForSelector({ text: site, tag: 'span' });
    } catch (e) {
      console.log(
        'Timeout while waiting for site permission page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Site permission page is loaded');
  }

  /**
   * Disconnect all permissions for accounts and networks
   */
  async disconnectAll(): Promise<void> {
    console.log('Disconnect all permissions for accounts and networks');
    await this.driver.clickElement(this.disconnectButton);
    await this.driver.waitForSelector(this.disconnectModalTitle);
    await this.driver.clickElementAndWaitToDisappear(
      this.confirmDisconnectButton,
    );
    await this.driver.waitForSelector(this.disconnectConfirmMessage);
  }

  /**
   * Open the account edit permissions modal
   */
  async openAccountPermissionsModal(): Promise<void> {
    const editButtons = await this.driver.findElements(this.editButton);
    await editButtons[0].click();
    await this.driver.waitForSelector(this.editAccountsModalTitle);
  }

  /**
   * Open the network edit permissions modal
   */
  async openNetworkPermissionsModal(): Promise<void> {
    const editButtons = await this.driver.findElements(this.editButton);
    await editButtons[1].click();
    await this.driver.waitForSelector(this.editNetworksModalTitle);
  }

  /**
   * Edit permissions for accounts on site permission page
   *
   * @param accountLabels - Account labels to edit
   */
  async editPermissionsForAccount(accountLabels: string[]): Promise<void> {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.log(`Edit permissions for accounts: ${accountLabels}`);
    await this.openAccountPermissionsModal();

    for (const accountLabel of accountLabels) {
      await this.driver.clickElement({ text: accountLabel, tag: 'button' });
    }
    await this.driver.clickElementAndWaitToDisappear(
      this.confirmEditAccountsButton,
    );
  }

  /**
   * Edit permissions for networks on site permission page
   *
   * @param networkNames - Network names to edit
   */
  async editPermissionsForNetwork(networkNames: string[]): Promise<void> {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.log(`Edit permissions for networks: ${networkNames}`);
    await this.openNetworkPermissionsModal();

    for (const networkName of networkNames) {
      await this.driver.clickElement({ text: networkName, tag: 'p' });
    }
    await this.driver.clickElementAndWaitToDisappear(
      this.confirmEditNetworksButton,
    );
  }

  /**
   * Check if the number of connected accounts is correct
   *
   * @param number - Expected number of connected accounts
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_connectedAccountsNumber(number: number): Promise<void> {
    console.log(`Check that the number of connected accounts is: ${number}`);
    await this.driver.waitForSelector({
      text: `${number} accounts connected`,
      tag: 'span',
    });
  }

  /**
   * Check if the number of connected networks is correct
   *
   * @param number - Expected number of connected networks
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_connectedNetworksNumber(number: number): Promise<void> {
    console.log(`Check that the number of connected networks is: ${number}`);
    await this.driver.waitForSelector({
      text: `${number} networks connected`,
      tag: 'span',
    });
  }
}

export default SitePermissionPage;
