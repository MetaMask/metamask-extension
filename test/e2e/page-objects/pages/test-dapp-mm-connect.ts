import { DAPP_HOST_ADDRESS } from '../../constants';
import { Driver } from '../../webdriver/driver';

/**
 * Replicates @metamask/playground-ui createTestId / escapeTestId.
 * Rules: lowercase, colon → dash, underscore → dash, spaces → dash,
 * strip any non-[a-z0-9-] characters, join parts with dash.
 *
 * @param value - The string to escape.
 * @returns The escaped string.
 */
function escapeTestId(value: string): string {
  return value
    .toLowerCase()
    .replace(/:/gu, '-')
    .replace(/\s+/gu, '-')
    .replace(/_/gu, '-')
    .replace(/[^a-z0-9-]/gu, '');
}

function createTestId(...parts: string[]): string {
  return parts.map(escapeTestId).filter(Boolean).join('-');
}

const TEST_DAPP_MM_CONNECT_URL = `http://${DAPP_HOST_ADDRESS}`;

/**
 * All CAIP-2 chain IDs available as checkboxes in the playground.
 * Derived from @metamask/playground-ui FEATURED_NETWORKS.
 * Used by selectNetworks() to know which checkboxes exist on the page.
 */
const ALL_FEATURED_CHAIN_IDS = [
  'eip155:1', // Ethereum Mainnet (pre-checked on page load)
  'eip155:59144', // Linea Mainnet
  'eip155:42161', // Arbitrum One
  'eip155:43114', // Avalanche C-Chain
  'eip155:56', // BNB Chain
  'eip155:10', // OP Mainnet
  'eip155:137', // Polygon Mainnet
  'eip155:324', // zkSync Era
  'eip155:8453', // Base Mainnet
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', // Solana Mainnet
] as const;

/**
 * Page object for MM Connect Test Dapp
 * Package: @metamask/browser-playground | Repo: metamask/connect-monorepo
 *
 * The dapp is served at TEST_DAPP_MM_CONNECT_URL (port 8080 when no
 * default test-dapps are running alongside it).
 *
 * Selector notes (from @metamask/playground-ui TEST_IDS + App.tsx):
 * - Network checkboxes live inside DynamicInputs, not FeaturedNetworks.
 * Their testId is: createTestId('dynamic-inputs', 'checkbox', chainId)
 * - app-section-connected is always in the DOM; use app-section-scopes to
 * confirm a multichain session is active.
 * - Ethereum (eip155:1) is pre-checked when the page first loads.
 * - The method selector in each ScopeCard is a native HTML <select>.
 * - Solana is included in the multichain session via selectNetworks() and
 * appears as a ScopeCard (not a separate wallet-standard flow).
 */
export class TestDappMmConnect {
  private readonly driver: Driver;

  // ──────────────────────────────────────────────────────────────────────────
  // Static selectors (TEST_IDS.app.*)
  // ──────────────────────────────────────────────────────────────────────────

  /** "Connect (Multichain)" button — present while disconnected or connecting. */
  private readonly connectButton = '[data-testid="app-btn-connect"]';

  /** "Disconnect All" button — calls sdkDisconnect() on the mm-connect dapp. */
  private readonly disconnectButton = '[data-testid="app-btn-disconnect"]';

  /**
   * Section that holds ScopeCards; only rendered when sessionScopes is
   * non-empty (i.e., a multichain session is active).
   */
  private readonly scopesSection = '[data-testid="app-section-scopes"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Navigation
  // ──────────────────────────────────────────────────────────────────────────

  async openPage(): Promise<void> {
    await this.driver.openNewPage(TEST_DAPP_MM_CONNECT_URL);
    await this.checkPageIsLoaded();
  }

  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.connectButton);
  }

  async switchTo(): Promise<void> {
    await this.driver.switchToWindowWithUrl(TEST_DAPP_MM_CONNECT_URL);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Network selection (DynamicInputs checkboxes)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Set the exact set of networks to be selected before connecting.
   *
   * Handles the pre-checked Ethereum case: eip155:1 is checked on page load,
   * so we only click a checkbox when its current state differs from the desired
   * state. This prevents accidentally toggling Ethereum off.
   *
   * @param desiredChainIds - CAIP-2 chain IDs that should be checked.
   * e.g. ['eip155:1', 'eip155:137', 'eip155:59144']
   */
  async selectNetworks(desiredChainIds: string[]): Promise<void> {
    for (const chainId of ALL_FEATURED_CHAIN_IDS) {
      const testId = createTestId('dynamic-inputs', 'checkbox', chainId);
      const el = await this.driver.findElement(`[data-testid="${testId}"]`);
      const isChecked = await el.isSelected();
      const shouldBeChecked = desiredChainIds.includes(chainId);
      if (isChecked !== shouldBeChecked) {
        await el.click();
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Connection lifecycle
  // ──────────────────────────────────────────────────────────────────────────

  /** Click the "Connect (Multichain)" button to start a wallet_createSession. */
  async clickConnect(): Promise<void> {
    await this.driver.clickElement(this.connectButton);
  }

  /**
   * Click "Disconnect All" — calls sdkDisconnect() on the mm-connect dapp,
   * which internally issues wallet_revokeSession.
   */
  async clickDisconnect(): Promise<void> {
    await this.driver.clickElement(this.disconnectButton);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // State assertions
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Assert multichain session state.
   * 'connected' → app-section-scopes is in the DOM (session has scopes)
   * 'disconnected' → app-section-scopes is NOT present; connect button is visible
   *
   * @param expected - Expected connection status ('connected' or 'disconnected').
   */
  async checkConnectionStatus(
    expected: 'connected' | 'disconnected',
  ): Promise<void> {
    if (expected === 'connected') {
      await this.driver.waitForSelector(this.scopesSection);
    } else {
      await this.driver.assertElementNotPresent(this.scopesSection);
      await this.driver.waitForSelector(this.connectButton);
    }
  }

  /**
   * Assert that a ScopeCard for the given CAIP-2 scope is visible.
   * Only applicable to scopes returned in the multichain session.
   *
   * @param scope - CAIP-2 chain ID, e.g. 'eip155:1'
   */
  async checkScopeCardVisible(scope: string): Promise<void> {
    const testId = createTestId('scope-card', scope);
    await this.driver.waitForSelector(`[data-testid="${testId}"]`);
  }

  /**
   * Assert that a ScopeCard for the given CAIP-2 scope is NOT present.
   *
   * @param scope - CAIP-2 chain ID, e.g. 'eip155:137'
   */
  async checkScopeCardNotVisible(scope: string): Promise<void> {
    const testId = createTestId('scope-card', scope);
    await this.driver.assertElementNotPresent(`[data-testid="${testId}"]`);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Method invocation via ScopeCard
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Select a JSON-RPC method in the named ScopeCard and click "Invoke Method",
   * then wait for the first result entry to appear.
   *
   * Use this for read-only methods (eth_chainId, eth_blockNumber, etc.) that
   * resolve without requiring user interaction in the extension.
   *
   * For methods that open a signing/approval dialog (personal_sign,
   * eth_sendTransaction), use triggerMethod() + handle the dialog + then
   * await getMethodResult() instead.
   *
   * @param scope  - CAIP-2 chain ID for the target ScopeCard, e.g. 'eip155:1'
   * @param method - JSON-RPC method name, e.g. 'eth_chainId'
   * @returns The text content of the result code element (result[0])
   */
  async invokeMethod(scope: string, method: string): Promise<string> {
    await this.triggerMethod(scope, method);
    return this.getMethodResult(scope, method);
  }

  /**
   * Select a method and click Invoke, but do NOT wait for the result.
   * Use when the method opens an extension dialog that must be handled first.
   *
   * @param scope  - CAIP-2 chain ID for the target ScopeCard, e.g. 'eip155:1'
   * @param method - JSON-RPC method name, e.g. 'personal_sign'
   */
  async triggerMethod(scope: string, method: string): Promise<void> {
    // Click the desired <option> inside the native HTML <select>.
    // Selenium's click on an <option> element selects it and fires the
    // browser's change event, which React's event system picks up.
    const methodSelectId = createTestId('scope-card', 'method-select', scope);
    const optionSelector = `[data-testid="${methodSelectId}"] option[value="${method}"]`;
    await this.driver.clickElement(optionSelector);

    const invokeBtnId = createTestId('scope-card', 'invoke-btn', scope);
    await this.driver.clickElement(`[data-testid="${invokeBtnId}"]`);
  }

  /**
   * Wait for the first result entry from a previously triggered method call
   * and return its text content.
   *
   * @param scope  - CAIP-2 chain ID for the target ScopeCard, e.g. 'eip155:1'
   * @param method - JSON-RPC method name, e.g. 'eth_chainId'
   * @returns The text content of the result code element (result[0])
   */
  async getMethodResult(scope: string, method: string): Promise<string> {
    const resultCodeId = createTestId(
      'scope-card',
      'result-code',
      scope,
      method,
      '0',
    );
    await this.driver.waitForSelector(`[data-testid="${resultCodeId}"]`);
    const resultEl = await this.driver.findElement(
      `[data-testid="${resultCodeId}"]`,
    );
    return resultEl.getText();
  }
}
