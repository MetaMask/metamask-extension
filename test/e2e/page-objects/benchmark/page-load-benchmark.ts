import { promises as fs } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { chromium, type BrowserContext, Browser } from '@playwright/test';

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

export type BenchmarkResult = {
  page: string;
  run: number;
  metrics: BenchmarkMetrics;
  timestamp: string;
};

export type BenchmarkSummary = {
  page: string;
  samples: number;
  mean: Partial<BenchmarkMetrics>;
  p95: Partial<BenchmarkMetrics>;
  p99: Partial<BenchmarkMetrics>;
  min: Partial<BenchmarkMetrics>;
  max: Partial<BenchmarkMetrics>;
  standardDeviation: Partial<BenchmarkMetrics>;
};

export class PageLoadBenchmark {
  private browser: Browser | undefined;

  private context: BrowserContext | undefined;

  private extensionPath: string;

  private results: BenchmarkResult[] = [];

  constructor(extensionPath: string) {
    this.extensionPath = extensionPath;
  }

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
      // TODO: [ffmcgee] We are overriding performance.now for more precise timing, evaluate if this stays or not
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        memoryUsage: (performance as any).memory
          ? {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
            }
          : undefined,
      };
    });

    const result: BenchmarkResult = {
      page: url,
      run: runNumber,
      metrics,
      timestamp: new Date().toISOString(),
    };

    this.results.push(result);
    await page.close();

    return result;
  }

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

  private calculateMean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.floor((percentile / 100) * sorted.length);
    return sorted[index];
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
    const variance = this.calculateMean(squaredDiffs);
    return Math.sqrt(variance);
  }

  async saveResults(outputPath: string) {
    const commitSha = execSync('git rev-parse --short HEAD', {
      cwd: __dirname,
      encoding: 'utf8',
    });

    const output = {
      timestamp: new Date().toISOString(),
      summary: this.calculateStatistics(),
      commit: commitSha,
      rawResults: this.results,
    };

    await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
    console.log(`Results saved to ${outputPath}`);
  }

  async cleanup() {
    await this.context?.close();
    await this.browser?.close();
  }
}
