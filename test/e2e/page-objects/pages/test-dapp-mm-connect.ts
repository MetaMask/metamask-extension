import assert from 'assert';
import { DAPP_URL, MM_CONNECT_FEATURED_CHAIN_IDS } from '../../constants';
import { Driver } from '../../webdriver/driver';

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
 * - On localhost/127.0.0.1, eip155:1337 is pre-checked on page load (≥0.6.1).
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

  private readonly wagmiTxHashResult = '[data-testid="wagmi-tx-hash-result"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Private static helpers — replicate @metamask/playground-ui test ID logic
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Replicates @metamask/playground-ui escapeTestId.
   * Rules: lowercase, colon → dash, underscore → dash, spaces → dash,
   * strip any non-[a-z0-9-] characters.
   *
   * @param value - The string to escape.
   * @returns The escaped string.
   */
  private static escapeTestId(value: string): string {
    return value
      .toLowerCase()
      .replace(/:/gu, '-')
      .replace(/\s+/gu, '-')
      .replace(/_/gu, '-')
      .replace(/[^a-z0-9-]/gu, '');
  }

  /**
   * Replicates @metamask/playground-ui createTestId.
   * Joins escaped parts with a dash.
   *
   * @param parts - Parts to join into a test ID.
   * @returns The composed test ID string.
   */
  private static createTestId(...parts: string[]): string {
    return parts.map(TestDappMmConnect.escapeTestId).filter(Boolean).join('-');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Private selector helpers (dynamic — depend on scope / method params)
  // ──────────────────────────────────────────────────────────────────────────

  private checkboxSelector(chainId: string): string {
    return `[data-testid="${TestDappMmConnect.createTestId('dynamic-inputs', 'checkbox', chainId)}"]`;
  }

  private scopeCardSelector(scope: string): string {
    return `[data-testid="${TestDappMmConnect.createTestId('scope-card', scope)}"]`;
  }

  private methodOptionSelector(scope: string, method: string): string {
    return `[data-testid="${TestDappMmConnect.createTestId('scope-card', 'method-select', scope)}"] option[value="${method}"]`;
  }

  private invokeBtnSelector(scope: string): string {
    return `[data-testid="${TestDappMmConnect.createTestId('scope-card', 'invoke-btn', scope)}"]`;
  }

  private resultCodeSelector(scope: string, method: string): string {
    return `[data-testid="${TestDappMmConnect.createTestId('scope-card', 'result-code', scope, method, '0')}"]`;
  }

  private resultDetailsSelector(scope: string, method: string): string {
    return `[data-testid="${TestDappMmConnect.createTestId('scope-card', 'result', scope, method, '0')}"] summary`;
  }

  private async getCheckboxState(selector: string): Promise<boolean> {
    let isChecked = false;
    await this.driver.waitUntil(
      async () => {
        try {
          const checkbox = await this.driver.findElement(selector);
          isChecked = await checkbox.isSelected();
          return true;
        } catch (error) {
          const err = error as { name?: string };
          if (
            err.name === 'NoSuchElementError' ||
            err.name === 'StaleElementReferenceError'
          ) {
            return false;
          }
          throw error;
        }
      },
      { interval: 200, timeout: this.driver.timeout },
    );

    return isChecked;
  }

  private async waitForCheckboxState(
    selector: string,
    expectedState: boolean,
  ): Promise<void> {
    await this.driver.waitUntil(
      async () => {
        try {
          const checkbox = await this.driver.findElement(selector);
          return (await checkbox.isSelected()) === expectedState;
        } catch (error) {
          const err = error as { name?: string };
          if (
            err.name === 'NoSuchElementError' ||
            err.name === 'StaleElementReferenceError'
          ) {
            return false;
          }
          throw error;
        }
      },
      { interval: 200, timeout: this.driver.timeout },
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Private shared interaction helpers
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Wait until the element identified by `selector` contains `expectedAddress`
   * (case-insensitive). Retries on stale-element errors.
   *
   * @param selector - CSS selector for the active-account element.
   * @param expectedAddress - Address substring to wait for.
   */
  private async waitForActiveAccount(
    selector: string,
    expectedAddress: string,
  ): Promise<void> {
    await this.driver.waitUntil(
      async () => {
        try {
          const el = await this.driver.findElement(selector);
          const text = await el.getText();
          return text.toLowerCase().includes(expectedAddress.toLowerCase());
        } catch {
          return false;
        }
      },
      { interval: 500, timeout: this.driver.timeout },
    );
  }

  /**
   * Wait for the element at `selector` to show `expectedChainId`.
   *
   * @param selector - CSS selector for the chain-ID display element.
   * @param expectedChainId - Chain ID string to wait for, e.g. '0x89' or '10'.
   */
  private async waitForChainId(
    selector: string,
    expectedChainId: string,
  ): Promise<void> {
    await this.driver.waitForSelector({ css: selector, text: expectedChainId });
  }

  /**
   * Return the current text of the element at `selector` without waiting for
   * a specific value.
   *
   * @param selector - CSS selector for the chain-ID display element.
   * @returns The raw text content of the element.
   */
  private async getChainId(selector: string): Promise<string> {
    const el = await this.driver.waitForSelector(selector);
    return el.getText();
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
   * Ensure the requested networks are selected before connecting.
   *
   * We intentionally avoid sweeping deselections of every non-requested
   * checkbox here. The browser-playground app can drop intermediate checkbox
   * updates when many toggles happen back-to-back, which causes flaky
   * multichain session scopes in CI. For these tests we only need to guarantee
   * the requested scopes are enabled.
   *
   * @param desiredChainIds - CAIP-2 chain IDs that should be checked.
   * e.g. ['eip155:1', 'eip155:137', 'eip155:59144']
   */
  async selectNetworks(desiredChainIds: string[]): Promise<void> {
    const featuredChainIds = new Set<string>(MM_CONNECT_FEATURED_CHAIN_IDS);

    for (const chainId of desiredChainIds) {
      if (!featuredChainIds.has(chainId)) {
        continue;
      }

      const selector = this.checkboxSelector(chainId);
      const isChecked = await this.getCheckboxState(selector);
      if (!isChecked) {
        await this.driver.clickElement(selector);
        // Ensure React has committed this checkbox state before moving
        // to the next one.
        await this.waitForCheckboxState(selector, true);
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

    const cssSelector = this.resultCodeSelector(scope, 'signMessage');
    let resultText = '';
    let parsed: Record<string, unknown> = {};
    // Both the emptiness check and JSON.parse are kept inside the polling
    // callback so transient states are retried rather than surfaced as errors:
    //  - Empty text: the <details> element may briefly have no text content
    //    immediately after the <summary> is clicked to expand it.
    //  - SyntaxError: the renderer may flush partial/incomplete JSON before
    //    the full result string is available.
    // Only when getText() returns a non-empty, fully parseable JSON string do
    // we capture both `parsed` and `resultText` and exit the loop, ensuring
    // the assert.ok calls below always operate on valid data.
    await this.driver.waitUntil(
      async () => {
        try {
          const element = await this.driver.findElement(cssSelector);
          const text = await element.getText();
          if (!text) {
            return false;
          }
          parsed = JSON.parse(text) as Record<string, unknown>;
          resultText = text;
          return true;
        } catch (error) {
          const err = error as { name?: string };
          if (
            err.name === 'StaleElementReferenceError' ||
            err.name === 'SyntaxError'
          ) {
            return false;
          }
          throw error;
        }
      },
      { interval: 500, timeout: this.driver.timeout },
    );

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
    await this.waitForChainId(this.legacyChainIdValue, expectedChainId);
  }

  /** Return the current chain ID text without waiting for a specific value. */
  async getLegacyChainId(): Promise<string> {
    return this.getChainId(this.legacyChainIdValue);
  }

  /**
   * Wait until the legacy active-account element shows the expected address.
   * Uses case-insensitive comparison because the dapp may render
   * checksummed addresses while tests pass lowercase.
   *
   * @param expectedAddress - The address to wait for
   */
  async waitForLegacyActiveAccount(expectedAddress: string): Promise<void> {
    await this.waitForActiveAccount(this.legacyActiveAccount, expectedAddress);
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
    await this.waitForChainId(this.wagmiChainIdValue, expectedChainId);
  }

  /** Return the current wagmi chain ID text without waiting for a specific value. */
  async getWagmiChainId(): Promise<string> {
    return this.getChainId(this.wagmiChainIdValue);
  }

  /**
   * Wait until the wagmi active-account element shows the expected address.
   * Uses case-insensitive comparison because wagmi may render
   * checksummed addresses while tests pass lowercase.
   *
   * @param expectedAddress - The address to wait for
   */
  async waitForWagmiActiveAccount(expectedAddress: string): Promise<void> {
    await this.waitForActiveAccount(this.wagmiActiveAccount, expectedAddress);
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
