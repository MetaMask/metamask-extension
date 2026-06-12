import { promises as fs } from 'fs';
import { execSync, spawn, ChildProcess } from 'child_process';
import path from 'path';
import { chromium, type BrowserContext, Browser } from '@playwright/test';
import {
  DEFAULT_BENCHMARK_BROWSER_LOADS,
  DEFAULT_BENCHMARK_PAGE_LOADS,
} from '../../../../../shared/constants/benchmarks';
import type {
  DappPageLoadMetric,
  DappPageLoadSample,
  DappPageLoadStats,
} from '../../utils/types';
import { DAPP_URL } from '../../../constants';
import { aggregateDappPageLoadStatistics } from './dapp-page-load-stats';

declare global {
  /**
   * We override Performance interface to make sure Typescript allows us to access memory property without
   * any type issues, and to make sure we do not need to typecast when accessing said property which is deprecated and not supported in some browsers
   * since our benchmark runs on Chrome only for now, that is not an issue, since Chrome fully supports the API
   * docs: https://developer.mozilla.org/en-US/docs/Web/API/Performance/memory#browser-compatibility
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
  private results: DappPageLoadSample[] = [];

  /** Dapp server process running in background */
  private dappServerProcess: ChildProcess | undefined;

  private readonly userDataDirectory = 'temp-benchmark-user-data';

  /**
   * Creates a new PageLoadBenchmark instance.
   *
   * @param extensionPath - Path to the MetaMask extension directory to test
   */
  constructor(extensionPath: string) {
    this.extensionPath = extensionPath;
  }

  /**
   * Initializes the browser environment and loads the MetaMask extension.
   * Builds the extension if needed, launches browser with optimized settings,
   * and waits for the extension to fully load.
   *
   * @throws {Error} If browser or context initialization fails
   */
  async setup() {
    await this.buildExtension();
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
  ): Promise<DappPageLoadSample> {
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
    const metrics: DappPageLoadMetric = await page.evaluate(() => {
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

    const result: DappPageLoadSample = {
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
   * Executes the complete benchmark test suite across multiple browser loads and page loads.
   * Uses the persistent browser context to simulate real-world conditions,
   * and measures each URL multiple times to gather statistical data.
   *
   * @param urls - Array of URLs to test
   * @param browserLoads - Number of browser load iterations (default: {@link DEFAULT_BENCHMARK_BROWSER_LOADS})
   * @param pageLoads - Number of page loads per browser load (default: {@link DEFAULT_BENCHMARK_PAGE_LOADS})
   */
  async runBenchmark(
    urls: string[],
    browserLoads: number = DEFAULT_BENCHMARK_BROWSER_LOADS,
    pageLoads: number = DEFAULT_BENCHMARK_PAGE_LOADS,
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
   * Calculates comprehensive statistical summaries for all benchmark results.
   * Groups results by page URL and computes mean, percentiles, min/max, and standard deviation
   * for each performance metric across all test runs.
   *
   * @returns Array of statistical summaries, one for each tested page
   */
  calculateStatistics(): DappPageLoadStats[] {
    return aggregateDappPageLoadStatistics(this.results);
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
   * Cleans up browser resources and closes all connections.
   * Should be called after benchmark testing is complete to free up system resources.
   */
  async cleanup() {
    await this.context?.close();
    await this.browser?.close();
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
