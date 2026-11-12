import { type CaipChainId } from '@metamask/utils';
import { convertCaipToHexChainId } from '../../../../../shared/lib/network.utils';
import { Driver } from '../../../webdriver/driver';

/**
 * The pills use the same chain id form as the network filter rows: hex for EVM
 * networks and CAIP for the rest. Tests refer to networks by CAIP chain id.
 *
 * @param chainId - A CAIP chain id, e.g. `eip155:1` or `solana:5eykt4...`.
 * @returns The chain id in the form used by the rendered pill.
 */
function toPillChainId(chainId: string): string {
  return chainId.startsWith('eip155:')
    ? convertCaipToHexChainId(chainId as CaipChainId)
    : chainId;
}

/**
 * The network pills above the token table in the wide layout
 * (`extensionUxFullscreenRedesign`). They filter the asset list by network the
 * same way the network filter modal does.
 *
 * Screen: home, wide layout only. The narrow layout has no pills; use
 * `NetworkFilter` and `SelectNetworkModal` there.
 * Owns: the pill row, its "show all" toggle, and selecting a network from it.
 * Boundaries: only networks the wallet already has and that are default
 * networks get a pill. Custom networks (e.g. the local node) and networks that
 * still have to be added are only available from the network filter modal.
 * Related: `NetworkFilter` (the filter toggle, which stays in the wide layout
 * and shows the current selection), `SelectNetworkModal`.
 *
 * @see ui/components/multichain/network-pill-selector/network-pill-selector.tsx
 */
class NetworkPillSelector {
  private readonly collapsedShowNetworksToggle =
    '[data-testid="network-pill-toggle"][aria-expanded="false"]';

  protected readonly driver: Driver;

  private readonly networkPill = (chainId: string) =>
    `[data-testid="network-pill-${toPillChainId(chainId)}"]`;

  private readonly networkPillSelector =
    '[data-testid="network-pill-selector"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkIsLoaded(): Promise<void> {
    console.log('Waiting for the network pills');
    await this.driver.waitForSelector(this.networkPillSelector);
  }

  /**
   * Checks that a network's pill is the selected one.
   *
   * @param chainId - The CAIP chain id of the network, e.g. `eip155:1`.
   */
  async checkNetworkPillIsSelected(chainId: string): Promise<void> {
    console.log(`Checking the network pill is selected: ${chainId}`);
    await this.driver.waitForSelector(
      `${this.networkPill(chainId)}[aria-pressed="true"]`,
    );
  }

  /**
   * Selects a network from the pill row. While the row is collapsed the pills
   * that do not fit are inert, so the row is expanded first when needed.
   *
   * @param chainId - The CAIP chain id of the network, e.g. `eip155:1`.
   */
  async selectNetwork(chainId: string): Promise<void> {
    console.log(`Selecting the network pill: ${chainId}`);
    const pill = this.networkPill(chainId);

    await this.checkIsLoaded();
    await this.driver.waitForSelector(pill);
    // Inert pills are still in the DOM, so read the attribute rather than
    // waiting for a usable pill to appear.
    const isPillInert = await this.driver.executeScript(
      'return document.querySelector(arguments[0])?.hasAttribute("inert") ?? false',
      pill,
    );
    if (isPillInert) {
      await this.driver.clickElement(this.collapsedShowNetworksToggle);
    }
    await this.driver.clickElement(`${pill}:not([inert])`);
    await this.checkNetworkPillIsSelected(chainId);
  }
}

export default NetworkPillSelector;
