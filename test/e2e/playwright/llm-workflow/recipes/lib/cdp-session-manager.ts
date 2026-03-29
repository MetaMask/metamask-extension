/**
 * CdpSessionManager — implements ISessionManager by attaching to an
 * already-running Chrome via chromium.connectOverCDP().
 *
 * Usage:
 *   const mgr = await CdpSessionManager.connect(6668);
 */

/* eslint-disable import-x/extensions */
import { promises as fs } from 'fs';
import path from 'path';
import { chromium, type Browser, type Page, type BrowserContext } from '@playwright/test';
import {
  resolveExtensionId,
  generateSessionId,
  ErrorCodes,
  type ISessionManager,
  type SessionState,
  type SessionLaunchInput,
  type SessionLaunchResult,
  type TrackedPage,
  type TabRole,
  type SessionScreenshotOptions,
  type ScreenshotResult,
  type ExtensionState,
  type BuildCapability,
  type FixtureCapability,
  type ChainCapability,
  type ContractSeedingCapability,
  type StateSnapshotCapability,
  type EnvironmentMode,
} from '@metamask/client-mcp-core';
/* eslint-enable import-x/extensions */
import type { SessionMetadata } from '@metamask/client-mcp-core';
import { getExtensionState as readExtensionState } from '../../launcher/state-inspector';

export class CdpSessionManager implements ISessionManager {
  private browser: Browser;

  private cdpContext: BrowserContext;

  private activePage: Page;

  private extensionId: string;

  private sessionId: string;

  private startedAt: string;

  private refMap: Map<string, string> = new Map();

  private screenshotDir: string;

  private constructor(
    browser: Browser,
    cdpContext: BrowserContext,
    activePage: Page,
    extensionId: string,
  ) {
    this.browser = browser;
    this.cdpContext = cdpContext;
    this.activePage = activePage;
    this.extensionId = extensionId;
    this.sessionId = generateSessionId();
    this.startedAt = new Date().toISOString();
    this.screenshotDir = path.join(
      process.cwd(),
      'test-artifacts',
      'screenshots',
    );
  }

  /**
   * Connect to an existing Chrome browser via CDP.
   * Resolves the MetaMask extension ID and finds (or navigates to) home.html.
   */
  static async connect(cdpPort: number): Promise<CdpSessionManager> {
    const browser = await chromium.connectOverCDP(
      `http://localhost:${cdpPort}`,
    );

    // connectOverCDP returns a Browser; get its first (default) context.
    const contexts = browser.contexts();
    const cdpContext = contexts[0];
    if (!cdpContext) {
      throw new Error(`CDP: no browser context found on port ${cdpPort}`);
    }

    const log = {
      info: (message: string) => process.stdout.write(`[cdp] ${message}\n`),
      warn: (message: string, error?: unknown) =>
        process.stderr.write(`[cdp] WARN: ${message} ${error ?? ''}\n`),
    };

    const extensionId = await resolveExtensionId({ context: cdpContext, log });
    if (!extensionId) {
      throw new Error('CDP: Could not resolve MetaMask extension ID');
    }

    const homeUrl = `chrome-extension://${extensionId}/home.html`;

    // Find an existing extension page or navigate to home.html.
    // NOTE: Playwright's page.url() may report stale URLs (e.g. chrome-error://) for
    // extension pages when connecting over CDP after an extension reload. We use a raw
    // CDP Page.navigate via newCDPSession to work around goto() being blocked for
    // chrome-extension:// URLs in CDP-connected mode.
    let activePage = cdpContext
      .pages()
      .find((p) => p.url().startsWith(`chrome-extension://${extensionId}`));

    if (!activePage) {
      // Pick any non-chrome:// page to navigate, or create a new one.
      const candidate =
        cdpContext.pages().find((p) => !p.isClosed() && !p.url().startsWith('chrome://')) ??
        (await cdpContext.newPage());

      // Use raw CDP Page.navigate to bypass Playwright's chrome-extension:// block.
      const cdpSession = await cdpContext.newCDPSession(candidate);
      await cdpSession.send('Page.navigate', { url: homeUrl });
      // Wait for the page to become interactive.
      await candidate.waitForLoadState('domcontentloaded').catch(() => {});
      activePage = candidate;
    }

    return new CdpSessionManager(browser, cdpContext, activePage, extensionId);
  }

  // ── ISessionManager: session lifecycle ──────────────────────────────

  hasActiveSession(): boolean {
    return true;
  }

  getSessionId(): string | undefined {
    return this.sessionId;
  }

  getSessionState(): SessionState | undefined {
    return {
      sessionId: this.sessionId,
      extensionId: this.extensionId,
      startedAt: this.startedAt,
      ports: { anvil: 0, fixtureServer: 0 },
      stateMode: 'default',
    };
  }

  getSessionMetadata(): SessionMetadata | undefined {
    return undefined;
  }

  async launch(_input: SessionLaunchInput): Promise<SessionLaunchResult> {
    throw new Error(
      'CDP mode: already connected to existing browser — launch() is not supported',
    );
  }

  async cleanup(): Promise<boolean> {
    // Disconnect from CDP without killing the running browser.
    await this.browser.close();
    return true;
  }

  // ── ISessionManager: page management ────────────────────────────────

  getPage(): Page {
    return this.activePage;
  }

  setActivePage(page: Page): void {
    this.activePage = page;
    this.clearRefMap();
  }

  getTrackedPages(): TrackedPage[] {
    return this.cdpContext
      .pages()
      .filter((p) => !p.isClosed())
      .map((p) => ({
        role: this.classifyPageRole(p, this.extensionId),
        url: p.url(),
        page: p,
      }));
  }

  classifyPageRole(page: Page, extensionId?: string): TabRole {
    const url = page.url();
    const id = extensionId ?? this.extensionId;
    const extPrefix = `chrome-extension://${id}`;

    if (url.startsWith(extPrefix)) {
      if (url.includes('notification.html') || url.includes('sidepanel.html')) {
        return 'notification';
      }
      return 'extension';
    }
    if (url.startsWith('http')) {
      return 'dapp';
    }
    return 'other';
  }

  getContext(): BrowserContext {
    return this.cdpContext;
  }

  async getExtensionState(): Promise<ExtensionState> {
    const state = await readExtensionState(this.activePage, {
      extensionId: this.extensionId,
      chainId: 1,
    });
    // account-menu-icon is only on home screen — infer unlocked from screens
    // that are only reachable after unlock (settings, send, swap, etc.)
    const unlockedScreens = new Set([
      'home', 'settings', 'send', 'swap', 'bridge',
      'confirm-transaction', 'confirm-signature', 'confirmation', 'connect',
    ]);
    const isUnlocked = state.isUnlocked || unlockedScreens.has(state.currentScreen);
    return { ...state, isUnlocked };
  }

  // ── ISessionManager: navigation ──────────────────────────────────────

  async navigateToHome(): Promise<void> {
    await this.activePage.goto(
      `chrome-extension://${this.extensionId}/home.html`,
    );
    await this.activePage.waitForLoadState('domcontentloaded');
  }

  async navigateToSettings(): Promise<void> {
    await this.activePage.goto(
      `chrome-extension://${this.extensionId}/home.html#settings`,
    );
    await this.activePage.waitForLoadState('domcontentloaded');
  }

  async navigateToUrl(url: string): Promise<Page> {
    const newPage = await this.cdpContext.newPage();
    await newPage.goto(url);
    await newPage.waitForLoadState('domcontentloaded');
    this.setActivePage(newPage);
    return newPage;
  }

  async navigateToNotification(): Promise<Page> {
    const notificationPage = this.cdpContext
      .pages()
      .find(
        (p) =>
          p.url().includes('notification.html') ||
          p.url().includes('sidepanel.html'),
      );

    if (notificationPage) {
      await notificationPage.bringToFront();
      await notificationPage.waitForLoadState('domcontentloaded');
      this.setActivePage(notificationPage);
      return notificationPage;
    }

    const newPage = await this.cdpContext.newPage();
    await newPage.goto(
      `chrome-extension://${this.extensionId}/notification.html`,
    );
    await newPage.waitForLoadState('domcontentloaded');
    this.setActivePage(newPage);
    return newPage;
  }

  async waitForNotificationPage(timeoutMs: number): Promise<Page> {
    const pollInterval = 500;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const found = this.cdpContext.pages().find(
        (p) =>
          p.url().includes('notification.html') ||
          p.url().includes('sidepanel.html'),
      );
      if (found) {
        this.setActivePage(found);
        return found;
      }
      await new Promise<void>((resolve) => {
        setTimeout(resolve, pollInterval);
      });
    }

    throw new Error(
      `CDP: notification page did not appear within ${timeoutMs}ms`,
    );
  }

  // ── ISessionManager: screenshot ─────────────────────────────────────

  async screenshot(options: SessionScreenshotOptions): Promise<ScreenshotResult> {
    await fs.mkdir(this.screenshotDir, { recursive: true });

    const timestamp = `-${Date.now()}`;
    const filename = `${options.name}${timestamp}.png`;
    const filepath = path.join(this.screenshotDir, filename);

    let screenshotBuffer: Buffer;

    if (options.selector) {
      const element = this.activePage.locator(options.selector);
      screenshotBuffer = await element.screenshot({ path: filepath });
    } else {
      screenshotBuffer = await this.activePage.screenshot({
        path: filepath,
        fullPage: options.fullPage !== false,
      });
    }

    const sharp = await import('sharp').then((m) => m.default);
    const metadata = await sharp(screenshotBuffer).metadata();

    return {
      path: filepath,
      base64: screenshotBuffer.toString('base64'),
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
    };
  }

  // ── ISessionManager: capabilities ───────────────────────────────────

  getBuildCapability(): BuildCapability | undefined {
    return undefined;
  }

  getFixtureCapability(): FixtureCapability | undefined {
    return undefined;
  }

  getChainCapability(): ChainCapability | undefined {
    return undefined;
  }

  getContractSeedingCapability(): ContractSeedingCapability | undefined {
    return undefined;
  }

  getStateSnapshotCapability(): StateSnapshotCapability | undefined {
    return undefined;
  }

  // ── ISessionManager: context / environment ───────────────────────────

  getEnvironmentMode(): EnvironmentMode {
    return 'prod';
  }

  setContext(_context: 'e2e' | 'prod', _options?: Record<string, unknown>): void {
    throw new Error(
      `${ErrorCodes.MM_CONTEXT_SWITCH_BLOCKED}: CDP mode — context switching is not supported`,
    );
  }

  getContextInfo(): {
    currentContext: 'e2e' | 'prod';
    hasActiveSession: boolean;
    sessionId: string | null;
    capabilities: { available: string[] };
    canSwitchContext: boolean;
  } {
    return {
      currentContext: 'prod',
      hasActiveSession: true,
      sessionId: this.sessionId,
      capabilities: { available: [] },
      canSwitchContext: false,
    };
  }

  // ── ISessionManager: a11y ref map ────────────────────────────────────

  setRefMap(map: Map<string, string>): void {
    this.refMap = map;
  }

  getRefMap(): Map<string, string> {
    return this.refMap;
  }

  clearRefMap(): void {
    this.refMap.clear();
  }

  resolveA11yRef(ref: string): string | undefined {
    return this.refMap.get(ref);
  }
}
