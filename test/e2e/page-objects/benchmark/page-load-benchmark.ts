import { promises as fs } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { chromium, type BrowserContext, Browser } from '@playwright/test';

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

    this.browser = await chromium.launch({
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
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

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
          navigation.domContentLoadedEventEnd -
          navigation.domContentLoadedEventStart,
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
      page: url,
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
   * Creates fresh browser contexts for each browser load to simulate real-world conditions,
   * and measures each URL multiple times to gather statistical data.
   *
   * @param urls - Array of URLs to test
   * @param browserLoads - Number of fresh browser contexts to create (default: 10)
   * @param pageLoads - Number of page loads per browser context (default: 10)
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

      // Setup fresh browser context for each browser load
      if (browserLoad > 0) {
        await this.context?.close();
        this.context = await this.browser?.newContext({
          viewport: { width: 1280, height: 720 },
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        });
        await this.waitForExtensionLoad();
      }

      for (const url of urls) {
        for (let pageLoad = 0; pageLoad < pageLoads; pageLoad++) {
          const runNumber = browserLoad * pageLoads + pageLoad;
          console.log(
            `  Measuring ${url} (run ${runNumber + 1}/${browserLoads * pageLoads})`,
          );

          try {
            await this.measurePageLoad(url, runNumber);
            // Small delay between measurements
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(
              `Error measuring ${url} (run ${runNumber + 1}):`,
              error,
            );
          }
        }
      }
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
          summary.mean[key] = this.calculateMean(values);
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
   * Calculates the arithmetic mean (average) of an array of numbers.
   *
   * @param values - Array of numeric values
   * @returns The mean value
   */
  private calculateMean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
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
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
    const variance = this.calculateMean(squaredDiffs);
    return Math.sqrt(variance);
  }

  /**
   * Saves benchmark results to a JSON file with comprehensive metadata.
   * Includes timestamp, git commit SHA, statistical summaries, and raw measurement data.
   *
   * @param outputPath - File path where results should be saved
   * @throws {Error} If file writing fails or git command fails
   */
  async saveResults(outputPath: string) {
    const commitSha = execSync('git rev-parse --short HEAD', {
      cwd: __dirname,
      encoding: 'utf8',
    });

    const output = {
      timestamp: new Date().getTime(),
      summary: this.calculateStatistics(),
      commit: commitSha,
      rawResults: this.results,
    };

    await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
    console.log(`Results saved to ${outputPath}`);
  }

  /**
   * Cleans up browser resources and closes all connections.
   * Should be called after benchmark testing is complete to free up system resources.
   */
  async cleanup() {
    await this.context?.close();
    await this.browser?.close();
  }
}
