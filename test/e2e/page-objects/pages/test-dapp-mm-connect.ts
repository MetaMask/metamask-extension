import assert from 'assert';
import { DAPP_URL, MM_CONNECT_FEATURED_CHAIN_IDS } from '../../constants';
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

/**
 * Page object for MM Connect Test Dapp
 * Package: @metamask/browser-playground | Repo: metamask/connect-monorepo
 *
 * The dapp is served at DAPP_URL (port 8080 when no default test-dapps
 * are running alongside it).
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
  private readonly connectButton = { testId: 'app-btn-connect' };

  /** "Connect (Legacy EVM)" button. */
  private readonly connectLegacyButton = { testId: 'app-btn-connect-legacy' };

  /** "Connect (Wagmi)" button. */
  private readonly connectWagmiButton = { testId: 'app-btn-connect-wagmi' };

  /** "Disconnect All" button — calls sdkDisconnect() on the mm-connect dapp. */
  private readonly disconnectButton = { testId: 'app-btn-disconnect' };

  /**
   * Section that is always in the DOM once the app mounts.
   * Used together with connectButton in checkPageIsLoaded.
   */
  private readonly connectedSection = { testId: 'app-section-connected' };

  /**
   * Section that holds ScopeCards; only rendered when sessionScopes is
   * non-empty (i.e., a multichain session is active).
   */
  private readonly scopesSection = { testId: 'app-section-scopes' };

  // ──────────────────────────────────────────────────────────────────────────
  // Legacy EVM card selectors (TEST_IDS.legacyEvm.*)
  // ──────────────────────────────────────────────────────────────────────────

  private readonly legacyCard = { testId: 'legacy-evm-card' };

  private readonly legacyChainIdValue =
    '[data-testid="legacy-evm-chain-id-value"]';

  private readonly legacyActiveAccount =
    '[data-testid="legacy-evm-active-account"]';

  private readonly legacyResponseText =
    '[data-testid="legacy-evm-response-text"]';

  private readonly legacyBtnPersonalSign = {
    testId: 'legacy-evm-btn-personal-sign',
  };

  private readonly legacyBtnSendTransaction = {
    testId: 'legacy-evm-btn-send-transaction',
  };

  private readonly legacyBtnSwitchToPolygon = {
    testId: 'legacy-evm-btn-switch-polygon',
  };

  private readonly legacyBtnSwitchToMainnet = {
    testId: 'legacy-evm-btn-switch-mainnet',
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Wagmi card selectors (TEST_IDS.wagmi.*)
  // ──────────────────────────────────────────────────────────────────────────

  private readonly wagmiCard = { testId: 'wagmi-card' };

  private readonly wagmiChainIdValue = '[data-testid="wagmi-chain-id-value"]';

  private readonly wagmiActiveAccount = '[data-testid="wagmi-active-account"]';

  private readonly wagmiInputMessage = '[data-testid="wagmi-input-message"]';

  private readonly wagmiBtnSignMessage = { testId: 'wagmi-btn-sign-message' };

  private readonly wagmiSignatureResult =
    '[data-testid="wagmi-signature-result"]';

  private readonly wagmiInputToAddress =
    '[data-testid="wagmi-input-to-address"]';

  private readonly wagmiInputAmount = '[data-testid="wagmi-input-amount"]';

  private readonly wagmiBtnSendTransaction = {
    testId: 'wagmi-btn-send-transaction',
  };

  private readonly wagmiTxError = '[data-testid="wagmi-tx-error"]';

  private readonly wagmiTxHashResult = '[data-testid="wagmi-tx-hash-result"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Private selector helpers (dynamic — depend on scope / method params)
  // ──────────────────────────────────────────────────────────────────────────

  private checkboxSelector(chainId: string): string {
    return `[data-testid="${createTestId('dynamic-inputs', 'checkbox', chainId)}"]`;
  }

  private scopeCardSelector(scope: string): string {
    return `[data-testid="${createTestId('scope-card', scope)}"]`;
  }

  private methodOptionSelector(scope: string, method: string): string {
    return `[data-testid="${createTestId('scope-card', 'method-select', scope)}"] option[value="${method}"]`;
  }

  private invokeBtnSelector(scope: string): string {
    return `[data-testid="${createTestId('scope-card', 'invoke-btn', scope)}"]`;
  }

  private resultCodeSelector(scope: string, method: string): string {
    return `[data-testid="${createTestId('scope-card', 'result-code', scope, method, '0')}"]`;
  }

  private resultDetailsSelector(scope: string, method: string): string {
    return `[data-testid="${createTestId('scope-card', 'result', scope, method, '0')}"] summary`;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Navigation
  // ──────────────────────────────────────────────────────────────────────────

  async openPage(): Promise<void> {
    await this.driver.openNewPage(DAPP_URL);
    await this.checkPageIsLoaded();
  }

  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForMultipleSelectors([
      this.connectButton,
      this.connectedSection,
    ]);
  }

  async switchTo(): Promise<void> {
    await this.driver.switchToWindowWithUrl(DAPP_URL);
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
    for (const chainId of MM_CONNECT_FEATURED_CHAIN_IDS) {
      const selector = this.checkboxSelector(chainId);
      const el = await this.driver.waitForSelector(selector);
      const isChecked = await el.isSelected();
      const shouldBeChecked = desiredChainIds.includes(chainId);
      if (isChecked !== shouldBeChecked) {
        await this.driver.clickElement(selector);
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
    await this.driver.waitForSelector(this.scopeCardSelector(scope));
  }

  /**
   * Assert that a ScopeCard for the given CAIP-2 scope is NOT present.
   *
   * @param scope - CAIP-2 chain ID, e.g. 'eip155:137'
   */
  async checkScopeCardNotVisible(scope: string): Promise<void> {
    await this.driver.assertElementNotPresent(this.scopeCardSelector(scope));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Method invocation via ScopeCard
  // ──────────────────────────────────────────────────────────────────────────

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
    await this.driver.clickElement(this.methodOptionSelector(scope, method));
    await this.driver.clickElement(this.invokeBtnSelector(scope));
  }

  /**
   * Wait for the result element to contain the expected text.
   * Avoids the find-then-assert anti-pattern by using waitForSelector with text.
   *
   * @param scope        - CAIP-2 chain ID for the target ScopeCard, e.g. 'eip155:1'
   * @param method       - JSON-RPC method name, e.g. 'eth_chainId'
   * @param expectedText - Text that the result element must contain.
   */
  async checkMethodResult(
    scope: string,
    method: string,
    expectedText: string,
  ): Promise<void> {
    await this.driver.waitForSelector({
      css: this.resultCodeSelector(scope, method),
      text: expectedText,
    });
  }

  /**
   * Assert the Solana signMessage result contains the expected JSON fields.
   * Expands the result <details> element before reading.
   *
   * @param scope - CAIP-2 scope for Solana, e.g. 'solana:5eykt4...'
   */
  async checkSolanaSignMessageResult(scope: string): Promise<void> {
    // Expand the result <details> so the text content is readable
    await this.driver.waitForSelector(
      this.resultCodeSelector(scope, 'signMessage'),
    );
    await this.driver.clickElement(
      this.resultDetailsSelector(scope, 'signMessage'),
    );

    const resultEl = await this.driver.waitForSelector(
      this.resultCodeSelector(scope, 'signMessage'),
    );
    const resultText = await resultEl.getText();
    const parsed = JSON.parse(resultText) as Record<string, unknown>;

    assert.ok(
      typeof parsed.signature === 'string',
      `Expected signMessage result for ${scope} to include string "signature", got: "${resultText}"`,
    );
    assert.ok(
      typeof parsed.signedMessage === 'string',
      `Expected signMessage result for ${scope} to include string "signedMessage", got: "${resultText}"`,
    );
    assert.ok(
      typeof parsed.signatureType === 'string',
      `Expected signMessage result for ${scope} to include string "signatureType", got: "${resultText}"`,
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Legacy EVM card
  // ──────────────────────────────────────────────────────────────────────────

  async connectLegacy(): Promise<void> {
    await this.driver.clickElement(this.connectLegacyButton);
  }

  async checkLegacyCardVisible(): Promise<void> {
    await this.driver.waitForSelector(this.legacyCard);
  }

  /**
   * Return the hex chain ID shown in the Legacy EVM card (e.g. "0x1").
   * Waits for a specific expected value to appear before returning.
   *
   * @param expectedChainId - Hex chain ID to wait for, e.g. '0x89'
   */
  async waitForLegacyChainId(expectedChainId: string): Promise<void> {
    await this.driver.waitForSelector({
      css: this.legacyChainIdValue,
      text: expectedChainId,
    });
  }

  /** Return the current chain ID text without waiting for a specific value. */
  async getLegacyChainId(): Promise<string> {
    const el = await this.driver.waitForSelector(this.legacyChainIdValue);
    return el.getText();
  }

  /**
   * Wait until the legacy active-account element shows the expected address.
   *
   * @param expectedAddress - The address to wait for
   */
  async waitForLegacyActiveAccount(expectedAddress: string): Promise<void> {
    await this.driver.waitForSelector({
      css: this.legacyActiveAccount,
      text: expectedAddress,
    });
  }

  /**
   * Assert the active-account element is absent.
   * This is the expected state after accountsChanged([]) fires (no permission).
   */
  async checkLegacyAccountNotConnected(): Promise<void> {
    await this.driver.assertElementNotPresent(this.legacyActiveAccount);
  }

  /**
   * Wait for the legacy response text element to contain the expected text.
   *
   * @param expectedText - Text that the response element must contain.
   */
  async checkLegacyResponse(expectedText: string): Promise<void> {
    await this.driver.waitForSelector({
      css: this.legacyResponseText,
      text: expectedText,
    });
  }

  async clickLegacyPersonalSign(): Promise<void> {
    await this.driver.clickElement(this.legacyBtnPersonalSign);
  }

  async clickLegacySendTransaction(): Promise<void> {
    await this.driver.clickElement(this.legacyBtnSendTransaction);
  }

  /**
   * Click the "Switch to Polygon" button in the Legacy EVM card.
   * Triggers wallet_switchEthereumChain('0x89').
   */
  async clickLegacySwitchToPolygon(): Promise<void> {
    await this.driver.clickElement(this.legacyBtnSwitchToPolygon);
  }

  /**
   * Click the "Switch to Mainnet" button in the Legacy EVM card.
   * Only visible when the current chain is not 0x1.
   * Triggers wallet_switchEthereumChain('0x1').
   */
  async clickLegacySwitchToMainnet(): Promise<void> {
    await this.driver.clickElement(this.legacyBtnSwitchToMainnet);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Wagmi card
  // ──────────────────────────────────────────────────────────────────────────

  async connectWagmi(): Promise<void> {
    await this.driver.clickElement(this.connectWagmiButton);
  }

  async checkWagmiCardVisible(): Promise<void> {
    await this.driver.waitForSelector(this.wagmiCard);
  }

  /**
   * Wait for the wagmi chain ID display to show a specific value.
   * The wagmi card shows chain IDs as decimal numbers (e.g. "10" for Optimism).
   *
   * @param expectedChainId - Decimal or string chain ID to wait for, e.g. '10'
   */
  async waitForWagmiChainId(expectedChainId: string): Promise<void> {
    await this.driver.waitForSelector({
      css: this.wagmiChainIdValue,
      text: expectedChainId,
    });
  }

  /** Return the current wagmi chain ID text without waiting for a specific value. */
  async getWagmiChainId(): Promise<string> {
    const el = await this.driver.waitForSelector(this.wagmiChainIdValue);
    return el.getText();
  }

  /**
   * Wait until the wagmi active-account element shows the expected address.
   *
   * @param expectedAddress - The address to wait for
   */
  async waitForWagmiActiveAccount(expectedAddress: string): Promise<void> {
    await this.driver.waitForSelector({
      css: this.wagmiActiveAccount,
      text: expectedAddress,
    });
  }

  /**
   * Assert the wagmi active-account element is absent.
   * Expected after accountsChanged([]) fires (wagmi disconnects).
   */
  async checkWagmiAccountNotConnected(): Promise<void> {
    await this.driver.assertElementNotPresent(this.wagmiActiveAccount);
  }

  /**
   * Fill the wagmi sign-message input and submit the form.
   * Opens a personal_sign confirmation in the extension.
   *
   * @param message - The message to sign
   */
  async signWagmiMessage(message: string): Promise<void> {
    await this.driver.fill(this.wagmiInputMessage, message);
    await this.driver.clickElement(this.wagmiBtnSignMessage);
  }

  /**
   * Wait for the wagmi signature result element to contain the expected text.
   *
   * @param expectedText - Text that the signature result element must contain.
   */
  async checkWagmiSignatureResult(expectedText: string): Promise<void> {
    await this.driver.waitForSelector({
      css: this.wagmiSignatureResult,
      text: expectedText,
    });
  }

  /**
   * Fill the wagmi send-transaction form and submit it.
   * Opens a transaction confirmation in the extension.
   *
   * @param to     - Recipient address (hex)
   * @param amount - ETH amount as a decimal string, e.g. "0.0001"
   */
  async sendWagmiTransaction(to: string, amount: string): Promise<void> {
    await this.driver.fill(this.wagmiInputToAddress, to);
    await this.driver.fill(this.wagmiInputAmount, amount);
    await this.driver.clickElement(this.wagmiBtnSendTransaction);
  }

  /**
   * Wait for the wagmi transaction hash element to contain the expected text.
   *
   * @param expectedText - Text that the tx hash element must contain.
   */
  async checkWagmiTxHash(expectedText: string): Promise<void> {
    await this.driver.waitForSelector({
      css: this.wagmiTxHashResult,
      text: expectedText,
    });
  }

  /**
   * Wait for the wagmi tx error element to contain the expected text.
   *
   * @param expectedText - Text that the error element must contain.
   */
  async checkWagmiTxError(expectedText: string): Promise<void> {
    await this.driver.waitForSelector({
      css: this.wagmiTxError,
      text: expectedText,
    });
  }

  /**
   * Click the "Switch to <chain>" button in the Wagmi card.
   * Triggers wallet_switchEthereumChain to the given chain.
   *
   * @param chainId - Numeric chain ID matching a configured wagmi chain (e.g. 10 for Optimism)
   */
  async clickWagmiSwitchChain(chainId: number): Promise<void> {
    await this.driver.clickElement(
      `[data-testid="wagmi-btn-switch-chain-${chainId}"]`,
    );
  }
}
