import path from 'path';
import { promises as fs, existsSync } from 'fs';
import { chromium, type Page, type BrowserContext } from '@playwright/test';
import {
  ConsoleErrorBuffer,
  fetchWithTimeout,
  resolveExtensionId,
  retryUntil,
  waitForExtensionUiReady,
} from '@metamask/metamask-extension-mcp';
import type {
  LauncherLaunchOptions,
  ScreenshotOptions,
  ScreenshotResult,
  ExtensionState,
  LauncherContext,
  MockServerConfig,
  NetworkConfig,
} from './launcher-types';
import { MockServer } from './mock-server';
import type {
  AnvilSeederWrapper,
  SmartContractName,
} from './anvil-seeder-wrapper';
import { getExtensionState } from './launcher/state-inspector';
import { AnvilService } from './launcher/anvil-service';

const DEFAULT_PASSWORD = 'correct horse battery staple';
const DEFAULT_ANVIL_PORT = 8545;
const DEFAULT_CHAIN_ID = 1337;

type ResolvedOptions = {
  extensionPath: string;
  userDataDir: string;
  viewportWidth: number;
  viewportHeight: number;
  slowMo: number;
  screenshotDir: string;
  stateMode: 'default' | 'onboarding' | 'custom';
  mockServer: MockServerConfig | null;
  network: NetworkConfig;
  anvilPort: number;
  seedContracts?: SmartContractName[];
};

export class MetaMaskExtensionLauncher {
  private context: BrowserContext | undefined;

  private extensionPage: Page | undefined;

  private extensionId: string | undefined;

  private anvilService: AnvilService | undefined;

  private mockServer: MockServer | undefined;

  private seeder: AnvilSeederWrapper | undefined;

  private options: ResolvedOptions;

  private userDataDir: string;

  private consoleErrorBuffer = new ConsoleErrorBuffer(100);

  constructor(options: LauncherLaunchOptions = {}) {
    this.options = {
      extensionPath:
        options.extensionPath ?? path.join(process.cwd(), 'dist', 'chrome'),
      userDataDir: options.userDataDir ?? '',
      viewportWidth: options.viewportWidth ?? 1280,
      viewportHeight: options.viewportHeight ?? 800,
      slowMo: options.slowMo ?? 0,
      screenshotDir:
        options.screenshotDir ??
        path.join(process.cwd(), 'test-artifacts', 'screenshots'),
      stateMode: options.stateMode ?? 'default',
      mockServer: options.mockServer ?? null,
      network: options.network ?? {
        mode: 'localhost',
        chainId: DEFAULT_CHAIN_ID,
      },
      anvilPort: options.ports?.anvil ?? DEFAULT_ANVIL_PORT,
      seedContracts: (options as { seedContracts?: SmartContractName[] })
        .seedContracts,
    };
    this.userDataDir = '';

    this.validateConfig();
  }

  private validateConfig(): void {
    this.ensureDependenciesInstalled();
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

  private ensureExtensionInitialized(): void {
    if (!this.extensionPage || !this.extensionId) {
      throw new Error(
        'Extension not initialized. Call launch() before using this method.',
      );
    }
  }

  private ensureBrowserContext(): void {
    if (!this.context || !this.extensionId) {
      throw new Error(
        'Browser context not initialized. Call launch() before using this method.',
      );
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

  private getChainId(): number {
    return this.options.network?.chainId ?? DEFAULT_CHAIN_ID;
  }

  async launch(): Promise<LauncherContext> {
    await this.validateExtensionExists();

    await this.ensureDirectories();

    try {
      await this.startAnvil();
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

      this.ensureExtensionInitialized();

      return {
        context: this.context as BrowserContext,
        extensionPage: this.extensionPage as Page,
        extensionId: this.extensionId as string,
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
      fetchWithTimeout,
      log: {
        info: (message: string) => console.log(message),
        error: (message: string, error?: unknown) =>
          console.error(message, error),
      },
    });

    await this.anvilService.start();
    this.seeder = this.anvilService.getSeeder();
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

    // MockServer uses self-signed certificates. We retry until the server responds,
    // treating cert errors as "server is ready" since they indicate the server is listening.
    const response = await retryUntil(
      async () => {
        try {
          const result = await fetchWithTimeout(
            `https://localhost:${port}/`,
            { method: 'GET' },
            3000,
          );
          // Success: got a response (503 is expected during startup)
          return result;
        } catch (e) {
          const error = e as Error;
          // Connection refused or timeout - server not ready yet, keep retrying
          if (
            (error.cause && String(error.cause).includes('ECONNREFUSED')) ||
            error.name === 'AbortError'
          ) {
            return null;
          }
          // Other errors (e.g., self-signed cert rejection) mean server is responding
          return { ok: true } as Response;
        }
      },
      (result) => result !== null,
      { attempts: maxAttempts, delayMs: 200 },
    );

    if (response) {
      console.log('MockServer is ready');
      return;
    }

    throw new Error(
      `MockServer failed to respond after ${maxAttempts} attempts on port ${port}. ` +
        `To kill any orphan process: lsof -ti:${port} | xargs kill -9`,
    );
  }

  /**
   * Validates that the extension is built and ready to load.
   * This method only validates - it does NOT build the extension.
   * Build logic is handled by BuildCapability in the MCP workflow.
   *
   * @throws Error if extension is not found at the configured path
   */
  private async validateExtensionExists(): Promise<void> {
    const manifestPath = path.join(this.options.extensionPath, 'manifest.json');

    try {
      await fs.access(this.options.extensionPath);
      await fs.access(manifestPath);
      console.log('Extension build found at:', this.options.extensionPath);
    } catch {
      throw new Error(
        `Extension not found at: ${this.options.extensionPath}\n\n` +
          'The extension must be built before launching.\n\n' +
          'Options:\n' +
          '  1. Use mm_build tool to build the extension\n' +
          '  2. Run "yarn build:test" manually\n' +
          '  3. Use MCP workflow with autoBuild: true (handled by BuildCapability)\n\n' +
          `Expected manifest at: ${manifestPath}`,
      );
    }
  }

  private async ensureDirectories(): Promise<void> {
    await fs.mkdir(this.options.screenshotDir, { recursive: true });
  }

  private async waitForExtensionReady(): Promise<void> {
    // Extension initialization flow:
    // 1. Get an existing page or create a new one (browser may have blank tab)
    // 2. Resolve the extension ID from Chrome's extension management API
    // 3. Navigate to home.html and wait for the UI to fully render
    if (!this.context) {
      throw new Error('Browser context not initialized');
    }

    const pages = (this.context as BrowserContext).pages();
    let page = pages[0];
    if (!page) {
      page = await this.context.newPage();
    }

    this.extensionId = await resolveExtensionId({
      context: this.context,
      log: {
        info: (message: string) => console.log(message),
        warn: (message: string, error?: unknown) =>
          console.warn(message, error),
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
        info: (message: string) => console.log(message),
        error: (message: string) => console.error(message),
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

  async screenshot(options: ScreenshotOptions): Promise<ScreenshotResult> {
    const page = options.page ?? this.extensionPage;
    if (!page) {
      throw new Error('No page available for screenshot');
    }

    const timestamp = options.timestamp === false ? '' : `-${Date.now()}`;
    const filename = `${options.name}${timestamp}.png`;
    const filepath = path.join(this.options.screenshotDir, filename);

    let screenshotBuffer: Buffer;

    if (options.selector) {
      const element = page.locator(options.selector);
      screenshotBuffer = await element.screenshot({ path: filepath });
    } else {
      screenshotBuffer = await page.screenshot({
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

  async getState(): Promise<ExtensionState> {
    this.ensureExtensionInitialized();

    return getExtensionState(this.extensionPage, {
      extensionId: this.extensionId,
      chainId: this.getChainId(),
    });
  }

  private async navigateToExtensionPath(navigationPath: string): Promise<void> {
    this.ensureExtensionInitialized();
    await (this.extensionPage as Page).goto(
      `chrome-extension://${this.extensionId as string}/${navigationPath}`,
    );
    await (this.extensionPage as Page).waitForLoadState('domcontentloaded');
  }

  async navigateToHome(): Promise<void> {
    await this.navigateToExtensionPath('home.html');
  }

  async navigateToSettings(): Promise<void> {
    await this.navigateToExtensionPath('home.html#settings');
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
    this.ensureBrowserContext();

    const extensionPrefix = `chrome-extension://${this.extensionId as string}`;
    return (this.context as BrowserContext)
      .pages()
      .filter((page) => page.url().startsWith(extensionPrefix));
  }

  async waitForNotificationPage(timeoutMs: number = 10000): Promise<Page> {
    // Notification pages may initially open as about:blank before the extension
    // redirects them. We wait for either an existing notification page or a new
    // page event, handling the about:blank → notification.html transition.
    this.ensureBrowserContext();

    const notificationUrl = `chrome-extension://${this.extensionId as string}/notification.html`;

    const existingPage = (this.context as BrowserContext)
      .pages()
      .find((page) => page.url().startsWith(notificationUrl));
    if (existingPage) {
      await existingPage.waitForLoadState('domcontentloaded');
      this.attachConsoleListeners(existingPage);
      return existingPage;
    }

    try {
      const newPage = await (this.context as BrowserContext).waitForEvent(
        'page',
        {
          timeout: timeoutMs,
          predicate: (page: Page) => {
            const url = page.url();
            return url.startsWith(notificationUrl) || url === 'about:blank';
          },
        },
      );

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
      const finalCheck = (this.context as BrowserContext)
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
      const allPorts = [anvilPort, mockServerPort].join(',');
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
  options?: LauncherLaunchOptions,
): Promise<MetaMaskExtensionLauncher> {
  const launcher = new MetaMaskExtensionLauncher(options);
  await launcher.launch();
  return launcher;
}

export { DEFAULT_PASSWORD };
