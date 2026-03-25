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
      let isChecked = false;
      await this.driver.waitUntil(
        async () => {
          try {
            const element = await this.driver.findElement(selector);
            isChecked = await element.isSelected();
            return true;
          } catch (error) {
            const err = error as { name?: string };
            if (err.name === 'StaleElementReferenceError') {
              return false;
            }
            throw error;
          }
        },
        { interval: 500, timeout: this.driver.timeout },
      );
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
}
