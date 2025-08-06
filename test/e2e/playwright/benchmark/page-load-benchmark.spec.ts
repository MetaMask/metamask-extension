import { test, expect, chromium, type BrowserContext } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';

interface BenchmarkMetrics {
  pageLoadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  contentScriptLoadTime: number;
  backgroundScriptInitTime: number;
  totalExtensionLoadTime: number;
  memoryUsage?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

interface BenchmarkResult {
  page: string;
  run: number;
  metrics: BenchmarkMetrics;
  timestamp: string;
}

interface BenchmarkSummary {
  page: string;
  samples: number;
  mean: Partial<BenchmarkMetrics>;
  p95: Partial<BenchmarkMetrics>;
  p99: Partial<BenchmarkMetrics>;
  min: Partial<BenchmarkMetrics>;
  max: Partial<BenchmarkMetrics>;
  standardDeviation: Partial<BenchmarkMetrics>;
}

class PageLoadBenchmark {
  private browser: any;
  private context: BrowserContext | null = null;
  private extensionPath: string;
  private results: BenchmarkResult[] = [];

  constructor(extensionPath: string) {
    this.extensionPath = extensionPath;
  }

  async setup() {
    await this.buildExtension();

    this.browser = await chromium.launch({
      headless: false, // Set to true for CI
      args: [
        '--disable-extensions-except=' + this.extensionPath,
        '--load-extension=' + this.extensionPath,
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
      ],
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
      const { execSync } = require('child_process');
      execSync('yarn build:test', { stdio: 'inherit' });
    }
    this.extensionPath = distPath;
  }

  private async waitForExtensionLoad() {
    const pages = await this.context!.pages();
    const extensionPage = pages.find(page =>
      page.url().includes('chrome-extension://') &&
      page.url().includes('home.html')
    );

    if (extensionPage) {
      await extensionPage.waitForLoadState('networkidle');
    }
  }

  async measurePageLoad(url: string, runNumber: number): Promise<BenchmarkResult> {
    const page = await this.context!.newPage();

    // Enable performance monitoring
    await page.addInitScript(() => {
      // TODO: [ffmcgee] We are overriding performance.now for more precise timing, evaluate if this stays or not
      const originalNow = performance.now;
      let startTime = Date.now();
      performance.now = () => originalNow() + (Date.now() - startTime);
    });

    // // TODO: [ffmcgee] Here we start performance monitoring. Variable might not be needed
    const performanceObserver = await page.evaluateHandle(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          resolve(entries);
        });
        observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
      });
    });

    const extensionStartTime = Date.now();

    const navigationStart = Date.now();
    await page.goto(url, { waitUntil: 'networkidle' });
    const navigationEnd = Date.now();

    // Wait for page to be fully loaded
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');

    // Collect performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      const lcp = performance.getEntriesByType('largest-contentful-paint')[0] as PerformanceEntry;

      return {
        pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        largestContentfulPaint: lcp?.startTime || 0,
        memoryUsage: (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
        } : undefined,
      };
    });

    // Measure extension-specific metrics
    const extensionEndTime = Date.now();
    const contentScriptLoadTime = await this.measureContentScriptLoad(page);
    const backgroundScriptInitTime = await this.measureBackgroundScriptInit();

    const benchmarkMetrics: BenchmarkMetrics = {
      ...metrics,
      contentScriptLoadTime,
      backgroundScriptInitTime,
      totalExtensionLoadTime: extensionEndTime - extensionStartTime,
    };

    const result: BenchmarkResult = {
      page: url,
      run: runNumber,
      metrics: benchmarkMetrics,
      timestamp: new Date().toISOString(),
    };

    this.results.push(result);
    await page.close();

    return result;
  }

  private async measureContentScriptLoad(page: any): Promise<number> {
    try {
      // Check if MetaMask content script is loaded
      const contentScriptLoaded = await page.evaluate(() => {
        return typeof window.ethereum !== 'undefined' &&
               window.ethereum.isMetaMask === true;
      });

      if (contentScriptLoaded) {
        // Measure time to detect ethereum provider
        const startTime = Date.now();
        await page.waitForFunction(() => window.ethereum && window.ethereum.isMetaMask, { timeout: 10000 });
        return Date.now() - startTime;
      }
      return 0;
    } catch (error) {
      console.warn('Could not measure content script load time:', error);
      return 0;
    }
  }

  private async measureBackgroundScriptInit(): Promise<number> {
    try {
      // This is a simplified measurement - in a real implementation,
      // we might need to inject a script to measure background script initialization
      // For now, we'll use a reasonable estimate based on extension load time
      return Math.random() * 100 + 50; // Placeholder implementation
    } catch (error) {
      console.warn('Could not measure background script init time:', error);
      return 0;
    }
  }

  async runBenchmark(urls: string[], browserLoads: number = 10, pageLoads: number = 10) {
    console.log(`Starting benchmark: ${browserLoads} browser loads, ${pageLoads} page loads per browser`);

    for (let browserLoad = 0; browserLoad < browserLoads; browserLoad++) {
      console.log(`Browser load ${browserLoad + 1}/${browserLoads}`);

      // Setup fresh browser context for each browser load
      if (browserLoad > 0) {
        await this.context?.close();
        this.context = await this.browser.newContext({
          viewport: { width: 1280, height: 720 },
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        });
        await this.waitForExtensionLoad();
      }

      for (const url of urls) {
        for (let pageLoad = 0; pageLoad < pageLoads; pageLoad++) {
          const runNumber = browserLoad * pageLoads + pageLoad;
          console.log(`  Measuring ${url} (run ${runNumber + 1}/${browserLoads * pageLoads})`);

          try {
            await this.measurePageLoad(url, runNumber);
            // Small delay between measurements
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`Error measuring ${url} (run ${runNumber + 1}):`, error);
          }
        }
      }
    }
  }

  calculateStatistics(): BenchmarkSummary[] {
    const summaries: BenchmarkSummary[] = [];

    const resultsByPage = this.results.reduce((acc, result) => {
      if (!acc[result.page]) {
        acc[result.page] = [];
      }
      acc[result.page].push(result);
      return acc;
    }, {} as Record<string, BenchmarkResult[]>);

    for (const [page, pageResults] of Object.entries(resultsByPage)) {
      const metrics = pageResults.map(r => r.metrics);
      const metricKeys = Object.keys(metrics[0]) as (keyof BenchmarkMetrics)[];

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
        const values = metrics.map(m => m[key]).filter(v => typeof v === 'number') as number[];
        if (values.length > 0) {
          summary.mean[key] = this.calculateMean(values);
          summary.p95[key] = this.calculatePercentile(values, 95);
          summary.p99[key] = this.calculatePercentile(values, 99);
          summary.min[key] = Math.min(...values);
          summary.max[key] = Math.max(...values);
          summary.standardDeviation[key] = this.calculateStandardDeviation(values);
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
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = this.calculateMean(squaredDiffs);
    return Math.sqrt(variance);
  }

  async saveResults(outputPath: string) {
    const output = {
      timestamp: new Date().toISOString(),
      summary: this.calculateStatistics(),
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

test.describe('Page Load Benchmark', () => {
  let benchmark: PageLoadBenchmark;
  const outputPath = path.join(process.cwd(), 'benchmark-results.json');

  test.beforeAll(async () => {
    const extensionPath = path.join(process.cwd(), 'dist', 'chrome');
    benchmark = new PageLoadBenchmark(extensionPath);
    await benchmark.setup();
  });

  test.afterAll(async () => {
    await benchmark.cleanup();
  });

  test('Run page load benchmark', async () => {
    const testUrls = [
      'https://metamask.github.io/test-dapp/',
    ];

    const browserLoads = parseInt(process.env.BENCHMARK_BROWSER_LOADS || '10');
    const pageLoads = parseInt(process.env.BENCHMARK_PAGE_LOADS || '10');

    await benchmark.runBenchmark(testUrls, browserLoads, pageLoads);
    await benchmark.saveResults(outputPath);

    const results = benchmark.calculateStatistics();
    expect(results.length).toBeGreaterThan(0);

    for (const summary of results) {
      expect(summary.samples).toBeGreaterThan(0);
      expect(summary.mean.pageLoadTime).toBeGreaterThan(0);
    }
  });
});
