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
  MockServerConfig,
  NetworkConfig,
} from './types';

import { OnboardingFlow } from './page-objects/onboarding/onboarding-flow';
import { MockServer } from './mock-server';
import type {
  AnvilSeederWrapper,
  SmartContractName,
} from './anvil-seeder-wrapper';
import { ConsoleErrorBuffer } from './launcher/console-error-buffer';
import { delay } from './launcher/retry';
import { resolveExtensionId } from './launcher/extension-id-resolver';
import { waitForExtensionUiReady } from './launcher/extension-readiness';
import {
  getExtensionState,
  detectCurrentScreen,
} from './launcher/state-inspector';
import { AnvilService } from './launcher/anvil-service';
import { FixtureServerService } from './launcher/fixture-server-service';

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
  seedContracts?: SmartContractName[];
};

export class MetaMaskExtensionLauncher {
  private context: BrowserContext | undefined;

  private extensionPage: Page | undefined;

  private extensionId: string | undefined;

  private anvilService: AnvilService | undefined;

  private fixtureServerService: FixtureServerService | undefined;

  private mockServer: MockServer | undefined;

  private seeder: AnvilSeederWrapper | undefined;

  private options: ResolvedOptions;

  private userDataDir: string;

  private consoleErrorBuffer = new ConsoleErrorBuffer(100);

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
      seedContracts: (options as { seedContracts?: SmartContractName[] })
        .seedContracts,
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
        // eslint-disable-next-line no-new
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
    this.anvilService = new AnvilService({
      network: this.options.network,
      anvilPort: this.options.anvilPort,
      defaultChainId: DEFAULT_CHAIN_ID,
      seedContracts: this.options.seedContracts,
      fetchWithTimeout: this.fetchWithTimeout.bind(this),
      log: {
        info: (message) => console.log(message),
        error: (message, error) => console.error(message, error),
      },
    });

    await this.anvilService.start();
    this.seeder = this.anvilService.getSeeder();
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

  private async startFixtureServer(): Promise<void> {
    this.fixtureServerService = new FixtureServerService({
      port: this.options.fixtureServerPort,
      stateMode: this.options.stateMode,
      fixture: this.options.fixture,
      fetchWithTimeout: this.fetchWithTimeout.bind(this),
      log: {
        info: (message) => console.log(message),
      },
    });

    await this.fixtureServerService.start();
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
    if (!this.mockServer) {
      return;
    }

    const port = this.mockServer.getPort();
    let ready = false;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const result = await this.fetchWithTimeout(
          `https://localhost:${port}/`,
          { method: 'GET' },
          3000,
        );
        if (result.status === 503 || result.ok) {
          ready = true;
          break;
        }
      } catch (e) {
        const error = e as Error;
        if (error.cause && String(error.cause).includes('ECONNREFUSED')) {
          await delay(200);
          continue;
        }
        if (error.name === 'AbortError') {
          await delay(200);
          continue;
        }
        console.log('MockServer is ready (self-signed cert accepted)');
        ready = true;
        break;
      }

      if (attempt < maxAttempts - 1) {
        await delay(200);
      }
    }

    if (ready) {
      console.log('MockServer is ready');
      return;
    }

    throw new Error(
      `MockServer failed to respond after ${maxAttempts} attempts on port ${port}. ` +
        `To kill any orphan process: lsof -ti:${port} | xargs kill -9`,
    );
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

    this.extensionId = await resolveExtensionId({
      context: this.context,
      log: {
        info: (message) => console.log(message),
        warn: (message, error) => console.warn(message, error),
      },
    });

    if (!this.extensionId) {
      throw new Error('Could not find MetaMask extension ID');
    }

    await page.goto(`chrome-extension://${this.extensionId}/home.html`);
    await page.waitForLoadState('domcontentloaded');

    this.attachConsoleListeners(page);

    await waitForExtensionUiReady({
      page,
      screenshotDir: this.options.screenshotDir,
      log: {
        info: (message) => console.log(message),
        error: (message) => console.error(message),
      },
    });

    this.extensionPage = page;
  }

  private attachConsoleListeners(page: Page): void {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.addConsoleError(msg.text(), page.url());
      }
    });

    page.on('pageerror', (error) => {
      this.addConsoleError(`Page error: ${error.message}`, page.url());
    });
  }

  private addConsoleError(message: string, source: string): void {
    this.consoleErrorBuffer.add({
      timestamp: Date.now(),
      message,
      source,
    });
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

    const timestamp = options.timestamp === false ? '' : `-${Date.now()}`;
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
    consoleErrors: {
      timestamp: number;
      message: string;
      source: string;
    }[];
  }> {
    const screenshot = await this.screenshot({ name, timestamp: false });
    const state = await this.getState();

    const stateFilePath = path.join(
      this.options.screenshotDir,
      `${name}-state.json`,
    );

    const consoleErrors = this.consoleErrorBuffer.getAll();
    const dumpData = {
      state,
      consoleErrors,
      timestamp: Date.now(),
    };

    await fs.writeFile(stateFilePath, JSON.stringify(dumpData, null, 2));

    console.log(`[debugDump] Screenshot: ${screenshot.path}`);
    console.log(`[debugDump] State JSON: ${stateFilePath}`);
    console.log(`[debugDump] Current screen: ${state.currentScreen}`);
    console.log(`[debugDump] Current URL: ${state.currentUrl}`);
    console.log(
      `[debugDump] Console errors captured: ${this.consoleErrorBuffer.size}`,
    );

    if (this.consoleErrorBuffer.size > 0) {
      console.log(`[debugDump] Recent errors:`);
      const recentErrors = this.consoleErrorBuffer.getRecent(5);
      for (const error of recentErrors) {
        console.log(
          `  - ${error.message.substring(0, 100)}${error.message.length > 100 ? '...' : ''}`,
        );
      }
    }

    return { screenshot, state, consoleErrors };
  }

  async getState(): Promise<ExtensionState> {
    if (!this.extensionPage || !this.extensionId) {
      throw new Error('Extension not initialized');
    }

    return getExtensionState(this.extensionPage, {
      extensionId: this.extensionId,
      chainId: this.getChainId(),
    });
  }

  private async detectCurrentScreen(): Promise<
    ExtensionState['currentScreen']
  > {
    return detectCurrentScreen(this.extensionPage);
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

  getSeeder(): AnvilSeederWrapper {
    if (!this.seeder) {
      throw new Error('Seeder not initialized. Ensure Anvil has started.');
    }
    return this.seeder;
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

  async waitForNotificationPage(timeoutMs: number = 10000): Promise<Page> {
    if (!this.context || !this.extensionId) {
      throw new Error('Browser context not initialized');
    }

    const notificationUrl = `chrome-extension://${this.extensionId}/notification.html`;

    const existingPage = this.context
      .pages()
      .find((page) => page.url().startsWith(notificationUrl));
    if (existingPage) {
      await existingPage.waitForLoadState('domcontentloaded');
      this.attachConsoleListeners(existingPage);
      return existingPage;
    }

    try {
      const newPage = await this.context.waitForEvent('page', {
        timeout: timeoutMs,
        predicate: (page: Page) => {
          const url = page.url();
          return url.startsWith(notificationUrl) || url === 'about:blank';
        },
      });

      if (newPage.url() === 'about:blank') {
        await newPage.waitForURL(
          (url) => url.toString().startsWith(notificationUrl),
          {
            timeout: timeoutMs / 2,
          },
        );
      }

      await newPage.waitForLoadState('domcontentloaded');
      this.attachConsoleListeners(newPage);
      return newPage;
    } catch (error) {
      const finalCheck = this.context
        .pages()
        .find((page) => page.url().startsWith(notificationUrl));
      if (finalCheck) {
        await finalCheck.waitForLoadState('domcontentloaded');
        this.attachConsoleListeners(finalCheck);
        return finalCheck;
      }

      const allPages = await this.getAllExtensionPages();
      const pageUrls = allPages.map((p) => p.url()).join(', ');

      throw new Error(
        `Notification page did not appear within ${timeoutMs}ms. ` +
          `Expected URL starting with: ${notificationUrl}. ` +
          `Current extension pages: [${pageUrls}]`,
      );
    }
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
    if (this.fixtureServerService) {
      try {
        await this.fixtureServerService.stop();
      } catch (e) {
        const msg = `Failed to stop FixtureServer on port ${fixtureServerPort}. Kill manually: lsof -ti:${fixtureServerPort} | xargs kill -9`;
        console.error(msg);
        errors.push(msg);
      }
      this.fixtureServerService = undefined;
    }

    if (this.seeder) {
      this.seeder.clearRegistry();
      this.seeder = undefined;
    }

    const anvilPort = this.getAnvilPort();
    if (this.anvilService) {
      try {
        await this.anvilService.stop();
      } catch (e) {
        const msg = `Failed to stop Anvil on port ${anvilPort}. Kill manually: lsof -ti:${anvilPort} | xargs kill -9`;
        console.error(msg);
        errors.push(msg);
      }
      this.anvilService = undefined;
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
