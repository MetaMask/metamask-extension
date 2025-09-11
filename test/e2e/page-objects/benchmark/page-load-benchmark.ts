import { promises as fs } from 'fs';
import { execSync, spawn, ChildProcess } from 'child_process';
import path from 'path';
import { chromium, type BrowserContext, Browser } from '@playwright/test';
import { mean } from 'lodash';
import { DAPP_URL } from '../../constants';
import FixtureServer from '../../fixture-server';
import { Anvil } from '../../seeder/anvil';

declare global {
  /**
   * We override Performance interface to make sure Typescript allows us to access memory property without
   * any type issues, and to make sure we do not need to typecast when accessing said property which is deprecated and not supported in some browsers
   * since our benchmark runs on Chrome only for now, that is not an issue, since Chrome fully supports the API
   * docs: https://developer.mozilla.org/en-US/docs/Web/API/Performance/memory#browser_compatibility
   */
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Performance {
    memory: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
}

/**
 * Performance metrics collected during page load benchmarking.
 * All time values are in milliseconds unless otherwise specified.
 */
export type BenchmarkMetrics = {
  /**
   * Total time from navigation start to load event end.
   * Represents the complete page load time including all resources.
   */
  pageLoadTime: number;
  /**
   * Time from navigation start to DOM content loaded event end.
   * Indicates when the initial HTML document has been completely loaded and parsed.
   */
  domContentLoaded: number;
  /**
   * Time from navigation start to first paint.
   * The first time any pixel is painted to the screen.
   */
  firstPaint: number;
  /**
   * Time from navigation start to first contentful paint.
   * The first time any content (text, images, etc.) is painted to the screen.
   * This is a key Core Web Vital metric.
   */
  firstContentfulPaint: number;
  /**
   * Time from navigation start to largest contentful paint.
   * The time when the largest content element becomes visible.
   * This is a key Core Web Vital metric for perceived loading speed.
   */
  largestContentfulPaint: number;
  /**
   * Memory usage statistics (optional, only available in Chrome).
   * All values are in bytes.
   */
  memoryUsage?: {
    /**
     * Currently used JavaScript heap size.
     * Represents the amount of memory actively used by JavaScript objects.
     */
    usedJSHeapSize: number;
    /**
     * Total allocated JavaScript heap size.
     * The total amount of memory allocated for the JavaScript heap.
     */
    totalJSHeapSize: number;
    /**
     * Maximum JavaScript heap size limit.
     * The maximum amount of memory that can be allocated for the JavaScript heap.
     */
    jsHeapSizeLimit: number;
  };
};

/**
 * Performance metrics collected during transaction proposal benchmarking.
 * All time values are in milliseconds unless otherwise specified.
 */
export type TransactionProposalMetrics = {
  /**
   * Time from transaction proposal initiation to MetaMask popup being fully visible and interactive.
   * This is the main metric we're measuring for wallet pop open time.
   */
  popOpenTime: number;
  /**
   * Time from transaction proposal initiation to MetaMask popup window appearing.
   * Measures how quickly the popup window becomes visible.
   */
  popupAppearTime: number;
  /**
   * Time from popup appearing to being fully interactive.
   * Measures how quickly the popup becomes ready for user interaction.
   */
  popupInteractiveTime: number;
};

/**
 * Individual benchmark measurement result for a single page load test.
 * Contains the raw performance metrics for one specific test run.
 */
export type BenchmarkResult = {
  /** URL of the page that was tested */
  page: string;
  /** Sequential run number for this test iteration */
  run: number;
  /** Performance metrics collected during this test run */
  metrics: BenchmarkMetrics;
  /** Timestamp when this measurement was taken */
  timestamp: number;
};

/**
 * Individual benchmark measurement result for a single transaction proposal test.
 * Contains the raw performance metrics for one specific test run.
 */
export type TransactionProposalResult = {
  /** Type of transaction proposal that was tested */
  proposalType: string;
  /** Sequential run number for this test iteration */
  run: number;
  /** Performance metrics collected during this test run */
  metrics: TransactionProposalMetrics;
  /** Timestamp when this measurement was taken */
  timestamp: number;
};

/**
 * Statistical summary of benchmark results for a specific page.
 * Contains aggregated statistics across multiple test runs for performance analysis.
 */
export type BenchmarkSummary = {
  /** URL of the page that was tested */
  page: string;
  /** Number of test samples collected for this page */
  samples: number;
  /** Mean (average) values for each performance metric */
  mean: Partial<BenchmarkMetrics>;
  /** 95th percentile values for each performance metric */
  p95: Partial<BenchmarkMetrics>;
  /** 99th percentile values for each performance metric */
  p99: Partial<BenchmarkMetrics>;
  /** Minimum values for each performance metric */
  min: Partial<BenchmarkMetrics>;
  /** Maximum values for each performance metric */
  max: Partial<BenchmarkMetrics>;
  /** Standard deviation values for each performance metric */
  standardDeviation: Partial<BenchmarkMetrics>;
};

/**
 * Statistical summary of transaction proposal benchmark results for a specific proposal type.
 * Contains aggregated statistics across multiple test runs for performance analysis.
 */
export type TransactionProposalSummary = {
  /** Type of transaction proposal that was tested */
  proposalType: string;
  /** Number of test samples collected for this proposal type */
  samples: number;
  /** Mean (average) values for each performance metric */
  mean: Partial<TransactionProposalMetrics>;
  /** 95th percentile values for each performance metric */
  p95: Partial<TransactionProposalMetrics>;
  /** 99th percentile values for each performance metric */
  p99: Partial<TransactionProposalMetrics>;
  /** Minimum values for each performance metric */
  min: Partial<TransactionProposalMetrics>;
  /** Maximum values for each performance metric */
  max: Partial<TransactionProposalMetrics>;
  /** Standard deviation values for each performance metric */
  standardDeviation: Partial<TransactionProposalMetrics>;
};

/**
 * Main class for conducting page load performance benchmarks using Playwright.
 * Manages browser lifecycle, extension loading, and performance measurement collection.
 */
export class PageLoadBenchmark {
  /** Playwright browser instance for running tests */
  private browser: Browser | undefined;

  /** Browser context for managing pages and sessions */
  private context: BrowserContext | undefined;

  /** Path to the MetaMask extension directory */
  private extensionPath: string;

  /** Collection of all benchmark results from test runs */
  private results: BenchmarkResult[] = [];

  /** Collection of all transaction proposal benchmark results from test runs */
  private transactionProposalResults: TransactionProposalResult[] = [];

  /** Dapp server process running in background */
  private dappServerProcess: ChildProcess | undefined;

  /** Fixture server for managing wallet state */
  private fixtureServer: FixtureServer;

  private localNode: Anvil | undefined;

  private readonly userDataDirectory = 'temp-benchmark-user-data';

  // TODO: [ffmcgee]: perhaps get this from WALLET_PASSWORD const, in test/e2e/constants.ts;
  private readonly walletPassword = 'correct horse battery staple';

  /**
   * Creates a new PageLoadBenchmark instance.
   *
   * @param extensionPath - Path to the MetaMask extension directory to test
   */
  constructor(extensionPath: string) {
    this.extensionPath = extensionPath;
    this.fixtureServer = new FixtureServer();
  }

  /**
   * Initializes the browser environment and loads the MetaMask extension.
   * Builds the extension if needed, launches browser with optimized settings,
   * and waits for the extension to fully load.
   *
   * @param fixtures - Wallet state.
   * @throws {Error} If browser or context initialization fails
   */
  async setup(fixtures?: unknown) {
    await this.buildExtension();
    await this.startFixtureServer(fixtures);
    await this.createStaticDappServer();

    const userDataDir = path.join(process.cwd(), this.userDataDirectory);
    await fs.mkdir(userDataDir, { recursive: true });

    this.context = await chromium.launchPersistentContext(userDataDir, {
      headless: Boolean(process.env.CI),
      args: [
        `--disable-extensions-except=${this.extensionPath}`,
        `--load-extension=${this.extensionPath}`,
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
      ],
      viewport: { width: 1280, height: 720 },
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    const browser = this.context.browser();
    if (!browser) {
      throw new Error('Failed to get browser instance from persistent context');
    }
    this.browser = browser;

    await this.waitForExtensionLoad();
  }

  /**
   * Starts up local blockchain node and fixture server for wallet state management.
   *
   * @param fixtures - Wallet state.
   */
  private async startFixtureServer(fixtures: unknown = {}) {
    this.localNode = new Anvil();
    await this.localNode.start();
    this.fixtureServer = new FixtureServer();
    await this.fixtureServer.start();
    this.fixtureServer.loadJsonState(fixtures);
  }

  /**
   * Ensures the MetaMask extension is built and ready for testing.
   * Checks if the extension already exists in the dist directory,
   * and builds it if necessary using the test build configuration.
   *
   * @throws {Error} If the build process fails
   */
  private async buildExtension() {
    // Check if extension is already built
    const distPath = path.join(process.cwd(), 'dist', 'chrome');
    try {
      await fs.access(distPath);
      console.log('Extension already built, using existing build');
    } catch {
      console.log('Building extension...');
      execSync('yarn build:test', { stdio: 'inherit' });
    }
    this.extensionPath = distPath;
  }

  /**
   * Starts the static dapp server in the background.
   * The server runs on port 8080 and serves the test dapp for benchmarking.
   */
  async createStaticDappServer() {
    try {
      console.log('Creating static dapp server...');

      this.dappServerProcess = spawn('yarn', ['dapp'], {
        stdio: 'pipe', // Capture output but don't block
        detached: false, // Keep attached to parent process for cleanup
        cwd: process.cwd(),
      });

      // Handle process events
      this.dappServerProcess.stdout?.on('data', (data) => {
        const output = data.toString();

        // `development/static-server.js` for further context on how server start up works
        if (output.includes('Running at http://localhost:')) {
          console.log('Static dapp server up!');
        }
      });

      this.dappServerProcess.stderr?.on('data', (data) => {
        console.error('Dapp server error:', data.toString());
      });

      this.dappServerProcess.on('error', (error) => {
        console.error('Failed to start dapp server:', error);
      });

      this.dappServerProcess.on('exit', (code) => {
        if (code !== 0) {
          console.error(`Dapp server exited with code ${code}`);
        }
      });

      // Give the server a moment to start up, otherwise benchmark may try to access page
      // while it's not yet ready to be served.
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 500);
      });
    } catch (e) {
      console.log('ERROR starting dapp server:', e);
      throw e;
    }
  }

  /**
   * Waits for the MetaMask extension to fully load in the browser.
   * Finds the extension's home page and waits for it to reach a stable state
   * before proceeding with benchmark tests.
   */
  private async waitForExtensionLoad() {
    const pages = await this.context?.pages();
    const extensionPage = pages?.find(
      (page) =>
        page.url().includes('chrome-extension://') &&
        page.url().includes('home.html'),
    );

    if (extensionPage) {
      await extensionPage.waitForLoadState('networkidle');
    }
  }

  /**
   * Unlocks the MetaMask wallet using the configured password.
   * Finds the unlock page and enters the password to unlock the wallet.
   * This should be called after the extension loads to ensure the wallet is ready for use.
   */
  private async unlockWallet() {
    // TODO: [ffmcgee]: see full interaction on spec run, this may be running without need in further runs.
    const walletPage = await this.context?.newPage();
    walletPage?.goto(
      'chrome-extension://hebhblbkkdabgoldnojllkipeoacjioc/home.html',
    );

    // Check if we're on the unlock page
    try {
      await walletPage?.waitForSelector('[data-testid="unlock-page"]', {
        timeout: 5000,
      });

      console.log('Wallet is locked, unlocking...');

      // Fill in the password
      await walletPage?.fill(
        '[data-testid="unlock-password"]',
        this.walletPassword,
      );

      // Click the unlock button
      await walletPage?.click('[data-testid="unlock-submit"]');

      // Wait for the unlock page to disappear (indicating successful unlock)
      await walletPage?.waitForSelector('[data-testid="unlock-page"]', {
        state: 'detached',
        timeout: 10000,
      });

      console.log('Wallet unlocked successfully');
    } catch (error) {
      // If unlock page selector is not found, wallet might already be unlocked
      console.log(
        'Wallet appears to already be unlocked or unlock page not found:',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Measures performance metrics for a single page load.
   * Navigates to the specified URL, waits for the page to fully load,
   * and collects comprehensive performance data including timing and memory usage.
   *
   * @param url - The URL to navigate to and measure
   * @param runNumber - Sequential number identifying this test run
   * @returns Promise resolving to the benchmark result for this page load
   * @throws {Error} If browser context is not initialized or page measurement fails
   */
  async measurePageLoad(
    url: string,
    runNumber: number,
  ): Promise<BenchmarkResult> {
    const page = await this.context?.newPage();

    if (!page) {
      throw new Error('Browser Context not initialized.');
    }

    // Enable performance monitoring
    await page.addInitScript(() => {
      const originalNow = performance.now;
      const startTime = Date.now();
      performance.now = () => originalNow() + (Date.now() - startTime);
    });

    await page.goto(url, { waitUntil: 'networkidle' });

    // Wait for page to be fully loaded
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');

    // Collect performance metrics
    const metrics: BenchmarkMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType(
        'navigation',
      )[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      const lcp = performance.getEntriesByType(
        'largest-contentful-paint',
      )[0] as PerformanceEntry;

      return {
        pageLoadTime: navigation.loadEventEnd - navigation.startTime,
        domContentLoaded:
          navigation.domContentLoadedEventEnd - navigation.startTime,
        firstPaint: paint.find((p) => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint:
          paint.find((p) => p.name === 'first-contentful-paint')?.startTime ||
          0,
        largestContentfulPaint: lcp?.startTime || 0,
        memoryUsage: performance.memory
          ? {
              usedJSHeapSize: performance.memory.usedJSHeapSize,
              totalJSHeapSize: performance.memory.totalJSHeapSize,
              jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
            }
          : undefined,
      };
    });

    const result: BenchmarkResult = {
      page: url === DAPP_URL ? 'Localhost MetaMask Test Dapp' : url,
      run: runNumber,
      metrics,
      timestamp: new Date().getTime(),
    };

    this.results.push(result);
    await page.close();

    return result;
  }

  /**
   * Measures performance metrics for a single transaction proposal.
   * Navigates to the test dapp and measures the time from proposal initiation
   * to when the extension responds (popup appears).
   *
   * @param proposalType - The type of transaction proposal to test (e.g., 'signTypedDataV4')
   * @param runNumber - Sequential number identifying this test run
   * @returns Promise resolving to the transaction proposal benchmark result
   * @throws {Error} If browser context is not initialized or measurement fails
   */
  async measureTransactionProposal(
    proposalType: string,
    runNumber: number,
  ): Promise<TransactionProposalResult> {
    const dappPage = await this.context?.newPage();
    if (!dappPage) {
      throw new Error('Browser Context not initialized.');
    }

    try {
      // Navigate to test dapp
      await dappPage.goto(DAPP_URL, { waitUntil: 'networkidle' });
      await dappPage.waitForLoadState('domcontentloaded');

      // Record start time for proposal initiation
      const proposalStartTime = Date.now();

      // Trigger the transaction proposal
      await dappPage.click(`#${proposalType}`);

      // Wait for MetaMask popup to appear and measure timing
      const metrics = await this.measurePopupTiming(proposalStartTime);

      const result: TransactionProposalResult = {
        proposalType,
        run: runNumber,
        metrics,
        timestamp: new Date().getTime(),
      };

      this.transactionProposalResults.push(result);
      return result;
    } finally {
      await dappPage.close();
    }
  }

  /**
   * Waits for MetaMask popup to appear and measures timing metrics.
   *
   * @param proposalStartTime - The timestamp when the proposal was initiated
   */
  private async measurePopupTiming(
    proposalStartTime: number,
  ): Promise<TransactionProposalMetrics> {
    // Wait for popup to appear
    const popupAppearTime = await this.waitForPopup();
    const popupAppearDuration = popupAppearTime - proposalStartTime;

    // Get the popup page
    const popup = await this.getMetaMaskPopup();
    if (!popup) {
      throw new Error('MetaMask popup not found');
    }

    // Wait for popup to be fully interactive
    const interactiveStartTime = Date.now();
    await popup.waitForLoadState('networkidle');
    await popup.waitForSelector('[data-testid="confirmation_message-section"]');
    const interactiveEndTime = Date.now();
    const popupInteractiveDuration = interactiveEndTime - interactiveStartTime;

    // TODO: [ffmcgee] clean these selectors into helper constants
    await popup.click('[data-testid="confirm-footer-cancel-button"]');

    // Calculate total pop open time
    const popOpenTime = popupAppearDuration + popupInteractiveDuration;

    return {
      popOpenTime,
      popupAppearTime: popupAppearDuration,
      popupInteractiveTime: popupInteractiveDuration,
    };
  }

  /**
   * Waits for MetaMask popup to appear and returns the timestamp when it appears.
   */
  private async waitForPopup(): Promise<number> {
    const maxWaitTime = 10000; // 10 seconds
    const checkInterval = 100; // 100ms
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const pages = (await this.context?.pages()) || [];
      const popup = pages.find(
        (page) =>
          page.url().includes('chrome-extension://') &&
          (page.url().includes('popup.html') ||
            page.url().includes('notification.html')),
      );

      if (popup) {
        return Date.now();
      }

      await new Promise((resolve) => setTimeout(resolve, checkInterval));
    }

    throw new Error('MetaMask popup did not appear within timeout');
  }

  /**
   * Gets the MetaMask popup page.
   */
  private async getMetaMaskPopup() {
    const pages = (await this.context?.pages()) || [];
    return pages.find(
      (page) =>
        page.url().includes('chrome-extension://') &&
        (page.url().includes('popup.html') ||
          page.url().includes('notification.html')),
    );
  }

  /**
   * Executes the complete benchmark test suite across multiple browser loads and page loads.
   * Uses the persistent browser context to simulate real-world conditions,
   * and measures each URL multiple times to gather statistical data.
   *
   * @param urls - Array of URLs to test
   * @param browserLoads - Number of browser load iterations (default: 10)
   * @param pageLoads - Number of page loads per browser load (default: 10)
   */
  async runBenchmark(
    urls: string[],
    browserLoads: number = 10,
    pageLoads: number = 10,
  ) {
    console.log(
      `Starting benchmark: ${browserLoads} browser loads, ${pageLoads} page loads per browser`,
    );

    for (let browserLoad = 0; browserLoad < browserLoads; browserLoad++) {
      console.log(`Browser load ${browserLoad + 1}/${browserLoads}`);
      await this.waitForExtensionLoad();

      for (const url of urls) {
        for (let pageLoad = 0; pageLoad < pageLoads; pageLoad++) {
          const runNumber = browserLoad * pageLoads + pageLoad;
          console.log(
            `  Measuring ${url} (run ${runNumber + 1}/${browserLoads * pageLoads})`,
          );

          await this.measurePageLoad(url, runNumber);
          /**
           * To make sure page setup & teardown doesn't have unexpected results in the next measurement,
           * we add a small delay between measurements.
           */
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
      await this.clearBrowserData();
    }
  }

  /**
   * Executes the complete transaction proposal benchmark test suite.
   * Creates fresh browser contexts for each browser load to simulate real-world conditions,
   * and measures each proposal type multiple times to gather statistical data.
   *
   * @param proposalType - Transaction proposal type to test
   * @param browserLoads - Number of fresh browser contexts to create (default: 10)
   * @param proposalLoads - Number of proposal tests per browser context (default: 10)
   */
  async runTransactionProposalBenchmark(
    proposalType: string,
    browserLoads: number = 10,
    proposalLoads: number = 10,
  ) {
    console.log(
      `Starting transaction proposal benchmark: ${browserLoads} browser loads, ${proposalLoads} proposal loads per browser`,
    );

    for (let browserLoad = 0; browserLoad < browserLoads; browserLoad++) {
      console.log(`Browser load ${browserLoad + 1}/${browserLoads}`);
      await this.waitForExtensionLoad();
      await this.unlockWallet();

      for (let proposalLoad = 0; proposalLoad < proposalLoads; proposalLoad++) {
        const runNumber = browserLoad * proposalLoads + proposalLoad;
        console.log(
          `  Measuring ${proposalType} (run ${runNumber + 1}/${browserLoads * proposalLoads})`,
        );

        await this.measureTransactionProposal(proposalType, runNumber);
        /**
         * To make sure page setup & teardown doesn't have unexpected results in the next measurement,
         * we add a small delay between measurements.
         */
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      await this.clearBrowserData();
    }
  }

  /**
   * Calculates comprehensive statistical summaries for all benchmark results.
   * Groups results by page URL and computes mean, percentiles, min/max, and standard deviation
   * for each performance metric across all test runs.
   *
   * @returns Array of statistical summaries, one for each tested page
   */
  calculateStatistics(): BenchmarkSummary[] {
    const summaries: BenchmarkSummary[] = [];

    const resultsByPage = this.results.reduce(
      (acc, result) => {
        if (!acc[result.page]) {
          acc[result.page] = [];
        }
        acc[result.page].push(result);
        return acc;
      },
      {} as Record<string, BenchmarkResult[]>,
    );

    for (const [page, pageResults] of Object.entries(resultsByPage)) {
      const metrics = pageResults.map((r) => r.metrics);
      const metricKeys = Object.keys(metrics[0]) as (keyof Omit<
        BenchmarkMetrics,
        'memoryUsage'
      >)[];

      const summary: BenchmarkSummary = {
        page,
        samples: metrics.length,
        mean: {},
        p95: {},
        p99: {},
        min: {},
        max: {},
        standardDeviation: {},
      };

      for (const key of metricKeys) {
        const values = metrics
          .map((m) => m[key])
          .filter((v) => typeof v === 'number') as number[];
        if (values.length > 0) {
          summary.mean[key] = mean(values);
          summary.p95[key] = this.calculatePercentile(values, 95);
          summary.p99[key] = this.calculatePercentile(values, 99);
          summary.min[key] = Math.min(...values);
          summary.max[key] = Math.max(...values);
          summary.standardDeviation[key] =
            this.calculateStandardDeviation(values);
        }
      }

      summaries.push(summary);
    }

    return summaries;
  }

  /**
   * Calculates comprehensive statistical summaries for all transaction proposal benchmark results.
   * Groups results by proposal type and computes mean, percentiles, min/max, and standard deviation
   * for each performance metric across all test runs.
   *
   * @returns Array of statistical summaries, one for each tested proposal type
   */
  calculateTransactionProposalStatistics(): TransactionProposalSummary[] {
    const summaries: TransactionProposalSummary[] = [];

    const resultsByProposalType = this.transactionProposalResults.reduce(
      (acc, result) => {
        if (!acc[result.proposalType]) {
          acc[result.proposalType] = [];
        }
        acc[result.proposalType].push(result);
        return acc;
      },
      {} as Record<string, TransactionProposalResult[]>,
    );

    for (const [proposalType, proposalResults] of Object.entries(
      resultsByProposalType,
    )) {
      const metrics = proposalResults.map((r) => r.metrics);
      const metricKeys = Object.keys(
        metrics[0],
      ) as (keyof TransactionProposalMetrics)[];

      const summary: TransactionProposalSummary = {
        proposalType,
        samples: metrics.length,
        mean: {},
        p95: {},
        p99: {},
        min: {},
        max: {},
        standardDeviation: {},
      };

      for (const key of metricKeys) {
        const values = metrics
          .map((m) => m[key])
          .filter((v) => typeof v === 'number') as number[];
        if (values.length > 0) {
          summary.mean[key] = mean(values);
          summary.p95[key] = this.calculatePercentile(values, 95);
          summary.p99[key] = this.calculatePercentile(values, 99);
          summary.min[key] = Math.min(...values);
          summary.max[key] = Math.max(...values);
          summary.standardDeviation[key] =
            this.calculateStandardDeviation(values);
        }
      }

      summaries.push(summary);
    }

    return summaries;
  }

  /**
   * Calculates the specified percentile value from an array of numbers.
   * Uses the nearest-rank method for percentile calculation.
   *
   * @param values - Array of numeric values
   * @param percentile - Percentile to calculate (0-100)
   * @returns The value at the specified percentile
   */
  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.floor((percentile / 100) * sorted.length);
    return sorted[index];
  }

  /**
   * Calculates the standard deviation of an array of numbers.
   * Uses the population standard deviation formula.
   *
   * @param values - Array of numeric values
   * @returns The standard deviation value
   */
  private calculateStandardDeviation(values: number[]): number {
    const calculatedMean = mean(values);
    const squaredDiffs = values.map((val) => Math.pow(val - calculatedMean, 2));
    const variance = mean(squaredDiffs);
    return Math.sqrt(variance);
  }

  /**
   * Saves benchmark results to a JSON file with comprehensive metadata.
   * Includes timestamp, git commit SHA, and statistical summaries.
   *
   * @param outputPath - File path where results should be saved
   * @throws {Error} If file writing fails or git command fails
   */
  async saveResults(outputPath: string) {
    const commitSha = execSync('git rev-parse --short HEAD', {
      cwd: __dirname,
      encoding: 'utf8',
    }).slice(0, 7);

    const output = {
      timestamp: new Date().getTime(),
      commit: commitSha,
      summary: this.calculateStatistics(),
    };

    await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
    console.log(`Results saved to ${outputPath}`);
  }

  /**
   * Saves transaction proposal benchmark results to a JSON file with comprehensive metadata.
   * Includes timestamp, git commit SHA, and statistical summaries.
   *
   * @param outputPath - File path where results should be saved
   * @throws {Error} If file writing fails or git command fails
   */
  async saveTransactionProposalResults(outputPath: string) {
    const commitSha = execSync('git rev-parse --short HEAD', {
      cwd: __dirname,
      encoding: 'utf8',
    }).slice(0, 7);

    const output = {
      timestamp: new Date().getTime(),
      commit: commitSha,
      summary: this.calculateTransactionProposalStatistics(),
      rawResults: this.transactionProposalResults,
    };

    await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
    console.log(`Transaction proposal results saved to ${outputPath}`);
  }

  /**
   * Clear browser data between browser loads to simulate fresh browser state.
   */
  private async clearBrowserData() {
    await this.context?.clearCookies();
    await this.context?.clearPermissions();
  }

  /**
   * Stops the dapp server process if it's running.
   */
  private stopDappServer() {
    if (this.dappServerProcess) {
      console.log('Stopping dapp server...');
      this.dappServerProcess.kill('SIGTERM');
      this.dappServerProcess = undefined;
    }
  }

  /**
   * Shuts down local node if it's running.
   */
  private async shutdownLocalNode() {
    if (this.localNode) {
      await this.localNode.quit();
    }
  }

  /**
   * Cleans up browser resources and closes all connections.
   * Should be called after benchmark testing is complete to free up system resources.
   */
  async cleanup() {
    await this.context?.close();
    await this.browser?.close();
    await this.shutdownLocalNode();
    this.stopDappServer();

    // Clean up temporary user data directory
    const userDataDir = path.join(process.cwd(), this.userDataDirectory);
    try {
      await fs.rm(userDataDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to clean up temporary user data directory:', error);
    }
  }
}
