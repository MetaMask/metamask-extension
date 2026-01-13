import path from 'path';
import { promises as fs, existsSync } from 'fs';
import { execSync } from 'child_process';
import { chromium, type Page, type BrowserContext } from '@playwright/test';
import type {
  LaunchOptions,
  ScreenshotOptions,
  ScreenshotResult,
  ExtensionState,
  LauncherContext,
  FixtureData,
} from './types';
import { Anvil } from '../../seeder/anvil';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const FixtureServer = require('../../fixtures/fixture-server');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  defaultFixture,
  FIXTURE_STATE_METADATA_VERSION,
} = require('../../fixtures/default-fixture');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const FixtureBuilderClass = require('../../fixtures/fixture-builder');

import { OnboardingFlow } from './page-objects/onboarding/onboarding-flow';
import { MockServer } from './mock-server';
import type { MockServerConfig, NetworkConfig, PortsConfig } from './types';

const DEFAULT_PASSWORD = 'correct horse battery staple';
const DEFAULT_ANVIL_PORT = 8545;
const FIXTURE_SERVER_PORT = 12345;
const DEFAULT_CHAIN_ID = 1337;

type ResolvedOptions = {
  extensionPath: string;
  userDataDir: string;
  viewportWidth: number;
  viewportHeight: number;
  slowMo: number;
  autoBuild: boolean;
  screenshotDir: string;
  stateMode: 'default' | 'onboarding' | 'custom';
  fixture: FixtureData | null;
  mockServer: MockServerConfig | null;
  network: NetworkConfig;
  anvilPort: number;
  fixtureServerPort: number;
};

export class MetaMaskExtensionLauncher {
  private context: BrowserContext | undefined;
  private extensionPage: Page | undefined;
  private extensionId: string | undefined;
  private anvil: Anvil | undefined;
  private fixtureServer: typeof FixtureServer | undefined;
  private mockServer: MockServer | undefined;
  private options: ResolvedOptions;
  private userDataDir: string;

  constructor(options: LaunchOptions = {}) {
    this.options = {
      extensionPath:
        options.extensionPath ?? path.join(process.cwd(), 'dist', 'chrome'),
      userDataDir: options.userDataDir ?? '',
      viewportWidth: options.viewportWidth ?? 1280,
      viewportHeight: options.viewportHeight ?? 800,
      slowMo: options.slowMo ?? 0,
      autoBuild: options.autoBuild ?? true,
      screenshotDir:
        options.screenshotDir ??
        path.join(process.cwd(), 'test-artifacts', 'screenshots'),
      stateMode: options.stateMode ?? 'default',
      fixture: options.fixture ?? null,
      mockServer: options.mockServer ?? null,
      network: options.network ?? {
        mode: 'localhost',
        chainId: DEFAULT_CHAIN_ID,
      },
      anvilPort: options.ports?.anvil ?? DEFAULT_ANVIL_PORT,
      fixtureServerPort: options.ports?.fixtureServer ?? FIXTURE_SERVER_PORT,
    };
    this.userDataDir = '';

    this.validateConfig();
  }

  private validateConfig(): void {
    this.ensureDependenciesInstalled();
    this.validateCustomStateModeRequiresFixture();
    this.validateNetworkModeRequiresRpcUrl();
  }

  private ensureDependenciesInstalled(): void {
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    if (!existsSync(nodeModulesPath)) {
      throw new Error(
        'Dependencies not installed. The node_modules directory was not found.\n\n' +
          'To fix this, run the following commands:\n' +
          '  1. yarn install    # Install dependencies\n' +
          '  2. yarn build:test # Build the extension\n\n' +
          'Then try running this workflow again.',
      );
    }
  }

  private validateCustomStateModeRequiresFixture(): void {
    if (this.options.stateMode === 'custom' && !this.options.fixture) {
      throw new Error(
        "Configuration error: stateMode 'custom' requires a 'fixture' to be provided. " +
          'Use createFixtureBuilder() or FixturePresets to create a fixture.',
      );
    }
  }

  private validateNetworkModeRequiresRpcUrl(): void {
    const mode = this.options.network?.mode;
    const rpcUrl = this.options.network?.rpcUrl;

    if (mode === 'custom' || mode === 'fork') {
      if (!rpcUrl) {
        throw new Error(
          `Configuration error: network.mode '${mode}' requires a valid 'rpcUrl' to be provided.`,
        );
      }
      try {
        new URL(rpcUrl);
      } catch {
        throw new Error(
          `Configuration error: network.rpcUrl '${rpcUrl}' is not a valid URL. ` +
            `Expected format: http://localhost:8545 or https://eth.llamarpc.com`,
        );
      }
    }
  }

  private getAnvilPort(): number {
    if (
      this.options.network?.mode === 'custom' &&
      this.options.network.rpcUrl
    ) {
      const parsedPort = parseInt(
        new URL(this.options.network.rpcUrl).port,
        10,
      );
      return parsedPort || this.options.anvilPort;
    }
    return this.options.anvilPort;
  }

  private getFixtureServerPort(): number {
    return this.options.fixtureServerPort;
  }

  private getChainId(): number {
    return this.options.network?.chainId ?? DEFAULT_CHAIN_ID;
  }

  async launch(): Promise<LauncherContext> {
    if (this.options.autoBuild) {
      await this.ensureExtensionBuilt();
    }

    await this.ensureDirectories();

    try {
      await this.startAnvil();
      await this.startFixtureServer();
      await this.startMockServer();

      this.userDataDir =
        this.options.userDataDir ||
        path.join(process.cwd(), `temp-llm-workflow-${Date.now()}`);
      await fs.mkdir(this.userDataDir, { recursive: true });

      const launchArgs = [
        `--disable-extensions-except=${this.options.extensionPath}`,
        `--load-extension=${this.options.extensionPath}`,
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
      ];

      this.context = await chromium.launchPersistentContext(this.userDataDir, {
        headless: false,
        args: launchArgs,
        viewport: {
          width: this.options.viewportWidth,
          height: this.options.viewportHeight,
        },
        slowMo: this.options.slowMo,
      });

      await this.waitForExtensionReady();

      if (!this.extensionPage || !this.extensionId) {
        throw new Error('Failed to initialize extension');
      }

      return {
        context: this.context,
        extensionPage: this.extensionPage,
        extensionId: this.extensionId,
      };
    } catch (error) {
      console.error('Launch failed, cleaning up services...');
      await this.cleanup();
      throw error;
    }
  }

  private async startAnvil(): Promise<void> {
    console.log('Starting Anvil...');
    this.anvil = new Anvil();

    const port = this.getAnvilPort();
    const chainId = this.getChainId();

    const anvilOptions: {
      port: number;
      chainId: number;
      forkUrl?: string;
      forkBlockNumber?: number;
    } = {
      port,
      chainId,
    };

    if (this.options.network?.mode === 'fork' && this.options.network.rpcUrl) {
      anvilOptions.forkUrl = this.options.network.rpcUrl;
      if (this.options.network.forkBlockNumber) {
        anvilOptions.forkBlockNumber = this.options.network.forkBlockNumber;
      }
    }

    await this.anvil.start(anvilOptions);
    await this.waitForAnvilReady();
    console.log(`Anvil started on port ${port} with chainId ${chainId}`);
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeoutMs = 5000,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async waitForAnvilReady(maxAttempts = 20): Promise<void> {
    const port = this.getAnvilPort();
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await this.fetchWithTimeout(
          `http://localhost:${port}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_blockNumber',
              params: [],
              id: 1,
            }),
          },
          3000,
        );
        if (response.ok) {
          const data = await response.json();
          if (data.result !== undefined) {
            console.log('Anvil is ready');
            return;
          }
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error(
      `Anvil failed to respond after ${maxAttempts} attempts on port ${port}. ` +
        `To kill any orphan process: lsof -ti:${port} | xargs kill -9`,
    );
  }

  private async startFixtureServer(): Promise<void> {
    console.log('Starting FixtureServer...');
    this.fixtureServer = new FixtureServer({
      port: this.getFixtureServerPort(),
    });
    await this.fixtureServer.start();
    await this.waitForFixtureServerReady();

    let fixture: FixtureData;

    if (this.options.fixture) {
      fixture = this.options.fixture;
      if (!fixture.meta) {
        fixture.meta = { version: FIXTURE_STATE_METADATA_VERSION };
      }
    } else if (this.options.stateMode === 'onboarding') {
      const builder = new FixtureBuilderClass({ onboarding: true });
      fixture = builder.build();
    } else {
      fixture = defaultFixture();
      fixture.meta = { version: FIXTURE_STATE_METADATA_VERSION };
    }

    this.fixtureServer.loadJsonState(fixture, null);
    console.log(
      `FixtureServer running on port ${this.getFixtureServerPort()} (mode: ${this.options.stateMode})`,
    );
  }

  private async waitForFixtureServerReady(maxAttempts = 10): Promise<void> {
    const port = this.getFixtureServerPort();
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await this.fetchWithTimeout(
          `http://localhost:${port}/state.json`,
          {},
          3000,
        );
        if (response.ok) {
          console.log('FixtureServer is ready');
          return;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }
    throw new Error(
      `FixtureServer failed to respond after ${maxAttempts} attempts on port ${port}. ` +
        `To kill any orphan process: lsof -ti:${port} | xargs kill -9`,
    );
  }

  private async startMockServer(): Promise<void> {
    if (!this.options.mockServer?.enabled) {
      return;
    }

    console.log(
      'Starting MockServer (EXPERIMENTAL - not wired to browser proxy)...',
    );
    this.mockServer = new MockServer({ port: this.options.mockServer.port });
    await this.mockServer.start();
    await this.waitForMockServerReady();
    await this.mockServer.setupDefaultMocks();

    if (this.options.mockServer.testSpecificMock) {
      await this.options.mockServer.testSpecificMock(
        this.mockServer.getServer(),
      );
    }
  }

  private async waitForMockServerReady(maxAttempts = 10): Promise<void> {
    if (!this.mockServer) return;

    const port = this.mockServer.getPort();
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await this.fetchWithTimeout(
          `https://localhost:${port}/`,
          { method: 'GET' },
          3000,
        );
        if (response.status === 503 || response.ok) {
          console.log('MockServer is ready');
          return;
        }
      } catch (e) {
        const error = e as Error;
        if (error.cause && String(error.cause).includes('ECONNREFUSED')) {
          await new Promise((r) => setTimeout(r, 200));
          continue;
        }
        if (error.name === 'AbortError') {
          await new Promise((r) => setTimeout(r, 200));
          continue;
        }
        console.log('MockServer is ready (self-signed cert accepted)');
        return;
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    throw new Error(
      `MockServer failed to respond after ${maxAttempts} attempts on port ${port}. ` +
        `To kill any orphan process: lsof -ti:${port} | xargs kill -9`,
    );
  }

  getMockServer(): MockServer | undefined {
    return this.mockServer;
  }

  private async ensureExtensionBuilt(): Promise<void> {
    try {
      await fs.access(this.options.extensionPath);
      const manifestPath = path.join(
        this.options.extensionPath,
        'manifest.json',
      );
      await fs.access(manifestPath);
      console.log('Extension build found at:', this.options.extensionPath);
    } catch {
      console.log('Extension not found, building...');
      console.log('Running: yarn build:test');
      execSync('yarn build:test', {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
      console.log('Extension build complete');
    }
  }

  private async ensureDirectories(): Promise<void> {
    await fs.mkdir(this.options.screenshotDir, { recursive: true });
  }

  private async waitForExtensionReady(): Promise<void> {
    if (!this.context) {
      throw new Error('Browser context not initialized');
    }

    const pages = this.context.pages();
    let page = pages[0];
    if (!page) {
      page = await this.context.newPage();
    }

    this.extensionId = await this.getExtensionId(page);

    if (!this.extensionId) {
      throw new Error('Could not find MetaMask extension ID');
    }

    await page.goto(`chrome-extension://${this.extensionId}/home.html`);
    await page.waitForLoadState('domcontentloaded');
    await this.waitForExtensionUIReady(page);

    this.extensionPage = page;
  }

  private async waitForExtensionUIReady(
    page: Page,
    timeout = 30000,
  ): Promise<void> {
    const selectors = [
      '[data-testid="unlock-password"]',
      '[data-testid="onboarding-create-wallet"]',
      '[data-testid="onboarding-import-wallet"]',
      '[data-testid="account-menu-icon"]',
      '[data-testid="get-started"]',
      '[data-testid="onboarding-terms-checkbox"]',
      '[data-testid="onboarding-privacy-policy"]',
    ];

    try {
      await Promise.race(
        selectors.map((selector) =>
          page.waitForSelector(selector, { timeout }),
        ),
      );
      console.log('Extension UI is ready');
    } catch {
      const currentUrl = page.url();
      const screenshotPath = path.join(
        this.options.screenshotDir,
        `ui-ready-failure-${Date.now()}.png`,
      );
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.error(`Debug screenshot saved: ${screenshotPath}`);

      throw new Error(
        `Extension UI did not reach expected state within ${timeout}ms. ` +
          `Current URL: ${currentUrl}. ` +
          'Expected one of: unlock page, onboarding page, or home page. ' +
          `Debug screenshot saved to: ${screenshotPath}`,
      );
    }
  }

  private async getExtensionId(
    page: Page,
    maxRetries = 3,
  ): Promise<string | undefined> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await page.goto('chrome://extensions');
        await page.waitForLoadState('domcontentloaded');
        await this.waitForExtensionsPageReady(page);

        const extensionId = await page.evaluate(() => {
          const extensionsManager =
            document.querySelector('extensions-manager');
          if (!extensionsManager?.shadowRoot) return undefined;

          const itemList = extensionsManager.shadowRoot.querySelector(
            'extensions-item-list',
          );
          if (!itemList?.shadowRoot) return undefined;

          const items = itemList.shadowRoot.querySelectorAll('extensions-item');

          for (const item of items) {
            const nameEl = item.shadowRoot?.querySelector('#name');
            const name = nameEl?.textContent || '';
            if (name.includes('MetaMask')) {
              return item.getAttribute('id') || undefined;
            }
          }

          return undefined;
        });

        if (extensionId) {
          return extensionId;
        }

        if (attempt < maxRetries) {
          console.warn(
            `MetaMask extension not found (attempt ${attempt}/${maxRetries}), retrying...`,
          );
          await new Promise((r) => setTimeout(r, 1000));
        }
      } catch (error) {
        if (attempt < maxRetries) {
          console.warn(
            `Error getting extension ID (attempt ${attempt}/${maxRetries}):`,
            error,
          );
          await new Promise((r) => setTimeout(r, 1000));
        } else {
          throw new Error(
            `Failed to get MetaMask extension ID after ${maxRetries} attempts. ` +
              `Ensure the extension is built at: ${this.options.extensionPath}. ` +
              `Run: yarn build:test`,
          );
        }
      }
    }

    return undefined;
  }

  private async waitForExtensionsPageReady(
    page: Page,
    maxAttempts = 20,
  ): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      const isReady = await page.evaluate(() => {
        const extensionsManager = document.querySelector('extensions-manager');
        if (!extensionsManager?.shadowRoot) return false;

        const itemList = extensionsManager.shadowRoot.querySelector(
          'extensions-item-list',
        );
        if (!itemList?.shadowRoot) return false;

        const items = itemList.shadowRoot.querySelectorAll('extensions-item');
        return items.length > 0;
      });

      if (isReady) {
        return;
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    throw new Error(
      `chrome://extensions page did not load extensions within ${maxAttempts * 100}ms. ` +
        'The shadow DOM structure was not fully populated. ' +
        'This may indicate a Chrome version incompatibility or slow system.',
    );
  }

  async unlock(password: string = DEFAULT_PASSWORD): Promise<void> {
    if (!this.extensionPage) {
      throw new Error('Extension page not initialized');
    }

    const passwordInput = this.extensionPage.locator(
      '[data-testid="unlock-password"]',
    );
    const unlockButton = this.extensionPage.locator(
      '[data-testid="unlock-submit"]',
    );

    await passwordInput.fill(password);
    await unlockButton.click();

    await this.extensionPage.waitForSelector(
      '[data-testid="account-menu-icon"]',
      {
        timeout: 10000,
      },
    );
  }

  async ensureUnlockedAndReady(
    password: string = DEFAULT_PASSWORD,
    maxAttempts = 3,
  ): Promise<void> {
    if (!this.extensionPage) {
      throw new Error('Extension page not initialized');
    }

    const modalSelectors = [
      '[data-testid="metametrics-i-agree"]',
      '[data-testid="onboarding-complete-done"]',
      '[data-testid="pin-extension-done"]',
      '[data-testid="download-app-continue"]',
      '[data-testid="popover-close"]',
      '[data-testid="modal-header-close-button"]',
      '[data-testid="survey-toast-banner-base"] [aria-label="Close"]',
      '[data-testid="shield-entry-modal-close-button"]',
      'button[aria-label="Close"]',
    ];

    const accountMenuIcon = this.extensionPage.locator(
      '[data-testid="account-menu-icon"]',
    );

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (attempt > 1) {
        await this.navigateToHome();
      }
      await this.extensionPage.waitForLoadState('domcontentloaded');

      for (const selector of modalSelectors) {
        const button = this.extensionPage.locator(selector).first();
        if (await button.isVisible({ timeout: 1500 }).catch(() => false)) {
          await button.click().catch(() => {});
          await button
            .waitFor({ state: 'hidden', timeout: 3000 })
            .catch(() => {});
        }
      }

      const unlockInput = this.extensionPage.locator(
        '[data-testid="unlock-password"]',
      );
      if (await unlockInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await unlockInput.fill(password);
        await this.extensionPage
          .locator('[data-testid="unlock-submit"]')
          .click();
        await accountMenuIcon
          .waitFor({ state: 'visible', timeout: 10000 })
          .catch(() => {});
      }

      if (
        await accountMenuIcon.isVisible({ timeout: 3000 }).catch(() => false)
      ) {
        return;
      }
    }

    const state = await this.getState();
    throw new Error(
      `Failed to reach ready state after ${maxAttempts} attempts. ` +
        `Current screen: ${state.currentScreen}`,
    );
  }

  async waitForScreen(
    screen: ExtensionState['currentScreen'],
    timeoutMs: number = 10000,
  ): Promise<void> {
    if (!this.extensionPage) {
      throw new Error('Extension page not initialized');
    }

    const startTime = Date.now();
    const pollInterval = 500;

    while (Date.now() - startTime < timeoutMs) {
      const currentScreen = await this.detectCurrentScreen();
      if (currentScreen === screen) {
        return;
      }
      await new Promise((r) => setTimeout(r, pollInterval));
    }

    const dump = await this.debugDump(`waitForScreen-${screen}-timeout`);
    throw new Error(
      `Timeout waiting for screen '${screen}' after ${timeoutMs}ms. ` +
        `Current screen: '${dump.state.currentScreen}'. ` +
        `Debug screenshot: ${dump.screenshot.path}`,
    );
  }

  async assertScreen(screen: ExtensionState['currentScreen']): Promise<void> {
    if (!this.extensionPage) {
      throw new Error('Extension page not initialized');
    }

    const currentScreen = await this.detectCurrentScreen();
    if (currentScreen !== screen) {
      const dump = await this.debugDump(`assertScreen-${screen}-failed`);
      throw new Error(
        `Expected screen '${screen}' but found '${currentScreen}'. ` +
          `Debug screenshot: ${dump.screenshot.path}. ` +
          `State JSON: ${dump.screenshot.path.replace('.png', '-state.json')}`,
      );
    }
  }

  async closeInterferingModals(): Promise<number> {
    if (!this.extensionPage) {
      throw new Error('Extension page not initialized');
    }

    const modalSelectors = [
      '[data-testid="popover-close"]',
      '[data-testid="modal-header-close-button"]',
      '[data-testid="survey-toast-banner-base"] [aria-label="Close"]',
      '[data-testid="shield-entry-modal-close-button"]',
      '[data-testid="pin-extension-done"]',
      '[data-testid="download-app-continue"]',
      'button[aria-label="Close"]',
    ];

    let closedCount = 0;

    for (const selector of modalSelectors) {
      const button = this.extensionPage.locator(selector).first();
      if (await button.isVisible({ timeout: 500 }).catch(() => false)) {
        await button.click().catch(() => {});
        await button
          .waitFor({ state: 'hidden', timeout: 2000 })
          .catch(() => {});
        closedCount++;
      }
    }

    return closedCount;
  }

  async completeOnboarding(options?: {
    seedPhrase?: string;
    password?: string;
  }): Promise<void> {
    if (!this.extensionPage) {
      throw new Error('Extension page not initialized');
    }

    const onboardingFlow = new OnboardingFlow(this.extensionPage);
    await onboardingFlow.importWallet(options);
  }

  async screenshot(options: ScreenshotOptions): Promise<ScreenshotResult> {
    if (!this.extensionPage) {
      throw new Error('Extension page not initialized');
    }

    const timestamp = options.timestamp !== false ? `-${Date.now()}` : '';
    const filename = `${options.name}${timestamp}.png`;
    const filepath = path.join(this.options.screenshotDir, filename);

    let screenshotBuffer: Buffer;

    if (options.selector) {
      const element = this.extensionPage.locator(options.selector);
      screenshotBuffer = await element.screenshot({ path: filepath });
    } else {
      screenshotBuffer = await this.extensionPage.screenshot({
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

  async debugDump(name: string): Promise<{
    screenshot: ScreenshotResult;
    state: ExtensionState;
    consoleErrors: string[];
  }> {
    const consoleErrors: string[] = [];

    if (this.extensionPage) {
      this.extensionPage.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
    }

    const screenshot = await this.screenshot({ name, timestamp: false });
    const state = await this.getState();

    const stateFilePath = path.join(
      this.options.screenshotDir,
      `${name}-state.json`,
    );
    await fs.writeFile(stateFilePath, JSON.stringify(state, null, 2));

    console.log(`[debugDump] Screenshot: ${screenshot.path}`);
    console.log(`[debugDump] State JSON: ${stateFilePath}`);
    console.log(`[debugDump] Current screen: ${state.currentScreen}`);
    console.log(`[debugDump] Current URL: ${state.currentUrl}`);
    if (consoleErrors.length > 0) {
      console.log(`[debugDump] Console errors: ${consoleErrors.length}`);
    }

    return { screenshot, state, consoleErrors };
  }

  async getState(): Promise<ExtensionState> {
    if (!this.extensionPage || !this.extensionId) {
      throw new Error('Extension not initialized');
    }

    const currentUrl = this.extensionPage.url();
    const isUnlocked = await this.extensionPage
      .locator('[data-testid="account-menu-icon"]')
      .isVisible()
      .catch(() => false);

    const currentScreen = await this.detectCurrentScreen();

    let accountAddress: string | null = null;
    let networkName: string | null = null;
    let chainId: number | null = this.getChainId();
    let balance: string | null = null;

    if (currentScreen === 'home' && isUnlocked) {
      const { HomePage } = await import('./page-objects/home-page');
      const homePage = new HomePage(this.extensionPage);

      accountAddress = (await homePage.getAccountAddress()) || null;
      networkName = (await homePage.getNetworkName()) || null;
      balance = (await homePage.getBalance()) || null;
    }

    return {
      isLoaded: true,
      currentUrl,
      extensionId: this.extensionId,
      isUnlocked,
      currentScreen,
      accountAddress,
      networkName,
      chainId,
      balance,
    };
  }

  private async detectCurrentScreen(): Promise<
    ExtensionState['currentScreen']
  > {
    if (!this.extensionPage) return 'unknown';

    const screenSelectors: Array<{
      screen: ExtensionState['currentScreen'];
      selector: string;
    }> = [
      { screen: 'unlock', selector: '[data-testid="unlock-password"]' },
      { screen: 'home', selector: '[data-testid="account-menu-icon"]' },
      { screen: 'onboarding-welcome', selector: '[data-testid="get-started"]' },
      {
        screen: 'onboarding-import',
        selector: '[data-testid="onboarding-import-wallet"]',
      },
      {
        screen: 'onboarding-create',
        selector: '[data-testid="onboarding-create-wallet"]',
      },
      {
        screen: 'onboarding-srp',
        selector: '[data-testid="srp-input-import__srp-note"]',
      },
      {
        screen: 'onboarding-password',
        selector: '[data-testid="create-password-new-input"]',
      },
      {
        screen: 'onboarding-complete',
        selector: '[data-testid="onboarding-complete-done"]',
      },
      {
        screen: 'onboarding-metametrics',
        selector: '[data-testid="metametrics-i-agree"]',
      },
      { screen: 'settings', selector: '[data-testid="settings-page"]' },
    ];

    for (const { screen, selector } of screenSelectors) {
      const isVisible = await this.extensionPage
        .locator(selector)
        .isVisible({ timeout: 500 })
        .catch(() => false);
      if (isVisible) {
        return screen;
      }
    }

    return 'unknown';
  }

  async navigateToHome(): Promise<void> {
    if (!this.extensionPage || !this.extensionId) {
      throw new Error('Extension not initialized');
    }
    await this.extensionPage.goto(
      `chrome-extension://${this.extensionId}/home.html`,
    );
    await this.extensionPage.waitForLoadState('domcontentloaded');
  }

  async navigateToSettings(): Promise<void> {
    if (!this.extensionPage || !this.extensionId) {
      throw new Error('Extension not initialized');
    }
    await this.extensionPage.goto(
      `chrome-extension://${this.extensionId}/home.html#settings`,
    );
    await this.extensionPage.waitForLoadState('domcontentloaded');
  }

  async click(selector: string): Promise<void> {
    if (!this.extensionPage) {
      throw new Error('Extension page not initialized');
    }
    await this.extensionPage.locator(selector).click();
  }

  async fill(selector: string, value: string): Promise<void> {
    if (!this.extensionPage) {
      throw new Error('Extension page not initialized');
    }
    await this.extensionPage.locator(selector).fill(value);
  }

  async waitFor(selector: string, timeout: number = 10000): Promise<void> {
    if (!this.extensionPage) {
      throw new Error('Extension page not initialized');
    }
    await this.extensionPage.waitForSelector(selector, { timeout });
  }

  async getText(selector: string): Promise<string> {
    if (!this.extensionPage) {
      throw new Error('Extension page not initialized');
    }
    return (await this.extensionPage.locator(selector).textContent()) ?? '';
  }

  getPage(): Page {
    if (!this.extensionPage) {
      throw new Error('Extension page not initialized');
    }
    return this.extensionPage;
  }

  getContext(): BrowserContext {
    if (!this.context) {
      throw new Error('Browser context not initialized');
    }
    return this.context;
  }

  getAnvil(): Anvil {
    if (!this.anvil) {
      throw new Error('Anvil not initialized');
    }
    return this.anvil;
  }

  async openNewDappPage(url: string): Promise<Page> {
    if (!this.context) {
      throw new Error('Browser context not initialized');
    }
    const page = await this.context.newPage();
    await page.goto(url);
    await page.waitForLoadState('domcontentloaded');
    return page;
  }

  async getAllExtensionPages(): Promise<Page[]> {
    if (!this.context || !this.extensionId) {
      throw new Error('Browser context not initialized');
    }

    const extensionPrefix = `chrome-extension://${this.extensionId}`;
    return this.context
      .pages()
      .filter((page) => page.url().startsWith(extensionPrefix));
  }

  async getNotificationPage(): Promise<Page | null> {
    if (!this.context || !this.extensionId) {
      throw new Error('Browser context not initialized');
    }

    const notificationUrl = `chrome-extension://${this.extensionId}/notification.html`;
    const pages = this.context.pages();

    for (const page of pages) {
      if (page.url().startsWith(notificationUrl)) {
        return page;
      }
    }

    return null;
  }

  async waitForNotificationPage(timeoutMs: number = 10000): Promise<Page> {
    if (!this.context || !this.extensionId) {
      throw new Error('Browser context not initialized');
    }

    const notificationUrl = `chrome-extension://${this.extensionId}/notification.html`;
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const existingPage = await this.getNotificationPage();
      if (existingPage) {
        await existingPage.waitForLoadState('domcontentloaded');
        return existingPage;
      }

      await new Promise((r) => setTimeout(r, 200));
    }

    const allPages = await this.getAllExtensionPages();
    const pageUrls = allPages.map((p) => p.url()).join(', ');

    throw new Error(
      `Notification page did not appear within ${timeoutMs}ms. ` +
        `Expected URL starting with: ${notificationUrl}. ` +
        `Current extension pages: [${pageUrls}]`,
    );
  }

  async switchToExtensionHome(): Promise<Page> {
    if (!this.extensionPage || !this.extensionId) {
      throw new Error('Extension not initialized');
    }

    await this.extensionPage.bringToFront();
    const currentUrl = this.extensionPage.url();
    const homeUrl = `chrome-extension://${this.extensionId}/home.html`;

    if (!currentUrl.startsWith(homeUrl)) {
      await this.navigateToHome();
    }

    return this.extensionPage;
  }

  async closeNotificationPage(): Promise<boolean> {
    const notificationPage = await this.getNotificationPage();
    if (notificationPage) {
      await notificationPage.close();
      return true;
    }
    return false;
  }

  async cleanup(): Promise<void> {
    const errors: string[] = [];

    if (this.context) {
      try {
        await this.context.close();
      } catch (e) {
        console.warn('Failed to close browser context:', e);
      }
      this.context = undefined;
    }

    if (this.mockServer) {
      const port = this.mockServer.getPort();
      try {
        await this.mockServer.stop();
      } catch (e) {
        const msg = `Failed to stop MockServer on port ${port}. Kill manually: lsof -ti:${port} | xargs kill -9`;
        console.error(msg);
        errors.push(msg);
      }
      this.mockServer = undefined;
    }

    const fixtureServerPort = this.getFixtureServerPort();
    if (this.fixtureServer) {
      try {
        await this.fixtureServer.stop();
      } catch (e) {
        const msg = `Failed to stop FixtureServer on port ${fixtureServerPort}. Kill manually: lsof -ti:${fixtureServerPort} | xargs kill -9`;
        console.error(msg);
        errors.push(msg);
      }
      this.fixtureServer = undefined;
    }

    const anvilPort = this.getAnvilPort();
    if (this.anvil) {
      try {
        await this.anvil.quit();
      } catch (e) {
        const msg = `Failed to stop Anvil on port ${anvilPort}. Kill manually: lsof -ti:${anvilPort} | xargs kill -9`;
        console.error(msg);
        errors.push(msg);
      }
      this.anvil = undefined;
    }

    if (errors.length > 0) {
      const mockServerPort = this.options.mockServer?.port ?? 8000;
      const allPorts = [anvilPort, fixtureServerPort, mockServerPort].join(',');
      console.error(
        '\n=== CLEANUP ERRORS ===\n' +
          'Some services failed to stop. This may cause port conflicts on next run.\n' +
          'To kill all potentially orphaned processes:\n' +
          `  lsof -ti:${allPorts} | xargs kill -9\n` +
          '======================\n',
      );
    }

    if (this.userDataDir && !this.options.userDataDir) {
      try {
        await fs.rm(this.userDataDir, { recursive: true, force: true });
      } catch {
        console.warn('Failed to clean up user data directory');
      }
    }

    this.extensionPage = undefined;
    this.extensionId = undefined;
  }
}

export async function launchMetaMask(
  options?: LaunchOptions,
): Promise<MetaMaskExtensionLauncher> {
  const launcher = new MetaMaskExtensionLauncher(options);
  await launcher.launch();
  return launcher;
}

export { DEFAULT_PASSWORD };
