import { Driver } from '../../../webdriver/driver';

/**
 * Add-network confirmation dialog ("Want to add this network?").
 *
 * Screen: confirmation dialog/window for `wallet_addEthereumChain` when MetaMask
 * itself prompts to add a network (template confirmation title
 * `wantToAddThisNetwork`). Despite the class name, selectors target add-network
 * copy, not the "switch network" permission screen.
 * Owns: add-network heading, network detail fields (via "See details"), and the
 * approve/submit control.
 * Boundaries: stops at this add-network template confirmation. Switch-network
 * permission UI belongs to `SwitchNetworkConfirmation`. RPC-provider warning
 * overlay belongs to `AddRpcProviderDialog`. Pending-confirmation alert belongs
 * to `NetworkSwitchAlertModal`.
 * Related: `SwitchNetworkConfirmation`, `AddRpcProviderDialog`,
 * `NetworkSwitchAlertModal`. Prefer `pages/networks/*` page objects for the
 * in-app network manager UX.
 *
 * @see ui/pages/confirmations/confirmation/templates/add-ethereum-chain.js
 */
class NetworkSwitchModalConfirmation {
  private readonly addNetworkMessage = {
    text: 'Want to add this network?',
    tag: 'h3',
  };

  private driver: Driver;

  private readonly seeDetailsButton = { tag: 'a', text: 'See details' };

  private readonly submitButton = '[data-testid="confirmation-submit-button"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkNetworkInformationIsDisplayed({
    currencySymbol,
    networkURL,
    chainId,
    networkName,
    blockExplorerURL,
  }: {
    currencySymbol: string;
    networkURL: string;
    chainId: string;
    networkName: string;
    blockExplorerURL: string;
  }): Promise<void> {
    console.log(
      'Check network information is correctly displayed on network switch modal',
    );
    await this.driver.waitForMultipleSelectors([
      { text: networkURL, tag: 'dd' },
      { text: currencySymbol, tag: 'dd' },
    ]);
    await this.driver.clickElement(this.seeDetailsButton);
    await this.driver.waitForMultipleSelectors([
      { text: chainId, tag: 'dd' },
      { text: networkName, tag: 'dd' },
      { text: blockExplorerURL, tag: 'dd' },
    ]);
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.addNetworkMessage,
        this.submitButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for add network confirmation modal to be loaded',
        e,
      );
      throw e;
    }
    console.log('Add network confirmation modal is loaded');
  }

  async clickApproveButton(): Promise<void> {
    console.log('Click Approve Button');
    await this.driver.clickElementAndWaitToDisappear(this.submitButton);
  }
}

export default NetworkSwitchModalConfirmation;
