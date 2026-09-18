import { Driver } from '../../../webdriver/driver';

/**
 * Warning modal when adding a new RPC provider for an existing network.
 *
 * Screen: modal layered over the add-Ethereum-chain confirmation when the
 * request adds/updates an RPC endpoint for a network that already exists
 * (title from `addEthereumChainWarningModalTitle`). Currently unused by E2E
 * specs but kept for that confirmation overlay.
 * Owns: network-name heading check and Approve dismiss.
 * Boundaries: stops at this warning overlay. The parent add-network
 * confirmation belongs to `NetworkSwitchModalConfirmation` /
 * `add-ethereum-chain` template. In-app RPC URL forms belong to
 * `pages/networks/*` / add-RPC URL modals.
 * Related: `NetworkSwitchModalConfirmation`, add-ethereum-chain confirmation
 * host in `confirmation.js`.
 *
 * @see ui/pages/confirmations/components/confirmation-warning-modal/confirmation-warning-modal.js
 */
class AddRpcProviderDialog {
  private addRpcProviderButton = {
    tag: 'button',
    text: 'Approve',
  };

  protected driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async approveAddRpcProvider() {
    await this.driver.clickElementAndWaitToDisappear(this.addRpcProviderButton);
  }

  /**
   * @param networkName - The name of the network for adding RPC provider
   */
  async checkPageIsLoaded(networkName: string): Promise<void> {
    try {
      await this.driver.waitForSelector(this.addRpcProviderButton);
      await this.driver.waitForSelector({
        text: `You are adding a new RPC provider for ${networkName}`,
        tag: 'h4',
      });
    } catch (e) {
      console.log(
        `Timeout while waiting for Add RPC provider dialog for ${networkName} to be loaded`,
        e,
      );
      throw e;
    }
    console.log(`Add RPC provider dialog for ${networkName} is loaded`);
  }
}

export default AddRpcProviderDialog;
