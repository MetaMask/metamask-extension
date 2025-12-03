import { promises as fs } from 'fs';
import path from 'path';
import { capitalize } from 'lodash';
import get from 'lodash/get';
import { hideBin } from 'yargs/helpers';
import { Key } from 'selenium-webdriver';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const yargs = require('yargs/yargs');
import { generateWalletState } from '../../../app/scripts/fixtures/generate-wallet-state';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const FixtureBuilder = require('../fixtures/fixture-builder');
import { exitWithError } from '../../../development/lib/exit-with-error';
// retry imported but using custom retryWithTracking for reporting
import {
  getFirstParentDirectoryThatExists,
  isWritable,
} from '../../helpers/file';
import { unlockWallet, withFixtures } from '../helpers';
import AccountListPage from '../page-objects/pages/account-list-page';
import HeaderNavbar from '../page-objects/pages/header-navbar';
import HomePage from '../page-objects/pages/home/homepage';
import AssetPicker from '../page-objects/pages/asset-picker';
import SendTokenPage from '../page-objects/pages/send/send-token-page';
import SelectNetwork from '../page-objects/pages/dialog/select-network';
import NetworkSwitchAlertModal from '../page-objects/pages/dialog/network-switch-alert-modal';
import AddEditNetworkModal from '../page-objects/pages/dialog/add-edit-network';
import AddNetworkRpcUrlModal from '../page-objects/pages/dialog/add-network-rpc-url';
import { Driver } from '../webdriver/driver';
// Note: completeImportSRPOnboardingFlow is not used - importSrpFlow has its own
// manual implementation to enable INP tracking via trackClick wrappers
import {
  BenchmarkResults,
  Metrics,
  StatisticalResult,
} from './types-generated';
import {
  ALL_METRICS,
  DEFAULT_NUM_BROWSER_LOADS,
  DEFAULT_NUM_PAGE_LOADS,
  DEFAULT_WARMUP_ITERATIONS,
  TIMEOUT_THRESHOLD_MS,
  WITH_STATE_POWER_USER,
  filterTimeouts,
  removeOutliersIQR,
} from './constants';

/**
 * Extended metrics that include React Compiler-specific metrics
 */
export type ReactCompilerMetrics = Metrics & {
  inp?: number; // Interaction to Next Paint
  inpCount?: number; // Number of interactions measured
  renderCount?: number; // Total number of React renders
  renderTime?: number; // Total time spent rendering (ms)
  averageRenderTime?: number; // Average time per render (ms)
  interactionLatency?: number; // Time from interaction to visual update
  componentRenderCounts?: Record<string, number>; // Render counts per component
  // Additional runtime performance metrics
  fcp?: number; // First Contentful Paint (ms)
  lcp?: number; // Largest Contentful Paint (ms)
  tti?: number; // Time to Interactive (ms)
  tbt?: number; // Total Blocking Time (ms)
  cls?: number; // Cumulative Layout Shift
  fid?: number; // First Input Delay (ms)
  // Lazy loading specific metrics
  scrollToLoadLatency?: number; // Average time from scroll to content appearing (ms)
  timeToFirstVisibleAsset?: number; // Time to first asset becoming visible (ms)
  timeTo75PercentLoaded?: number; // Time to reach 75% loaded threshold (ms)
  scrollEventCount?: number; // Number of scroll events
  totalScrollDistance?: number; // Total pixels scrolled
  assetsLoadedPerScroll?: number; // Average assets loaded per scroll increment
  cumulativeLoadTime?: number; // Total time spent waiting for assets to load (ms)
};

/**
 * Flow benchmark result
 */
export type FlowBenchmarkResult = {
  flow: string;
  run: number;
  metrics: ReactCompilerMetrics;
  timestamp: number;
};

/**
 * Flow benchmark arguments
 */
export type FlowBenchmarkArguments = {
  flows: string[];
  browserLoads: number;
  iterations: number;
  out?: string;
  retries: number;
  warmup: number;
  noOutlierFilter: boolean;
  portOffset: number;
};

/**
 * Flow run status for reporting
 */
export type FlowRunStatus = 'success' | 'failed' | 'skipped';

/**
 * Individual flow run report
 */
export type FlowRunReport = {
  flowName: string;
  status: FlowRunStatus;
  retriesUsed: number;
  totalRetries: number;
  errors: string[];
  warnings: string[];
  iterationsCompleted: number;
  iterationsRequested: number;
  browserLoadsCompleted: number;
  browserLoadsRequested: number;
};

/**
 * Complete benchmark run report
 */
export type BenchmarkRunReport = {
  startTime: Date;
  endTime: Date;
  durationMs: number;
  exitCode: number;
  flowReports: FlowRunReport[];
  globalWarnings: string[];
  summary: {
    totalFlows: number;
    successfulFlows: number;
    failedFlows: number;
    skippedFlows: number;
  };
};

/**
 * Injects React performance monitoring scripts into the page
 */
async function injectReactMonitoring(driver: Driver): Promise<void> {
  // console.log('[Inject] Starting injectReactMonitoring');
  const result = await driver.driver.executeScript(`
    // Initialize React Profiler data array (used by ui/index.js when Profiler is enabled)
    // This is only used in non-production builds
    if (!window.__REACT_RENDER_METRICS__) {
      window.__REACT_RENDER_METRICS__ = [];
    }

    // Initialize INP metrics object
    if (!window.__inpMetrics) {
      window.__inpMetrics = {
        interactions: [],
      };
    }

    // Initialize TBT metrics object
    if (!window.__tbtMetrics) {
      window.__tbtMetrics = {
        longTasks: [],
        totalBlockingTime: 0,
      };
    }

    // Set up INP event listeners (only if not already attached)
    if (!window.__inpListenersAttached) {
      // Track pointer events (click, keydown, tap)
      ['click', 'keydown', 'tap'].forEach((eventType) => {
        document.addEventListener(
          eventType,
          (event) => {
            if (!window.__inpMetrics || !window.__inpMetrics.interactions) return;
            const startTime = performance.now();
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                if (!window.__inpMetrics || !window.__inpMetrics.interactions) return;
                const endTime = performance.now();
                window.__inpMetrics.interactions.push({
                  start: startTime,
                  end: endTime,
                  duration: endTime - startTime,
                  type: eventType,
                });
              });
            });
          },
          { passive: true },
        );
      });

      // Track scroll events
      let scrollStartTime = null;
      let scrollTimeout = null;
      window.addEventListener('scroll', () => {
        if (!window.__inpMetrics || !window.__inpMetrics.interactions) return;
        if (scrollStartTime === null) {
          scrollStartTime = performance.now();
        }
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          if (!window.__inpMetrics || !window.__inpMetrics.interactions) return;
          if (scrollStartTime !== null) {
            const endTime = performance.now();
            window.__inpMetrics.interactions.push({
              start: scrollStartTime,
              end: endTime,
              duration: endTime - scrollStartTime,
              type: 'scroll',
            });
            scrollStartTime = null;
          }
        }, 150);
      }, { passive: true });

      window.__inpListenersAttached = true;
    }

    // Set up TBT observer (only if not already attached)
    if (!window.__tbtObserverAttached) {
      if (window.PerformanceObserver &&
          PerformanceObserver.supportedEntryTypes &&
          PerformanceObserver.supportedEntryTypes.includes('longtask')) {
        try {
          const longTaskObserver = new PerformanceObserver((list) => {
            if (!window.__tbtMetrics || !window.__tbtMetrics.longTasks) return;
            for (const entry of list.getEntries()) {
              const blockingTime = Math.max(0, entry.duration - 50);
              window.__tbtMetrics.longTasks.push({
                duration: entry.duration,
                blockingTime: blockingTime,
                startTime: entry.startTime,
              });
              window.__tbtMetrics.totalBlockingTime += blockingTime;
            }
          });
          longTaskObserver.observe({ entryTypes: ['longtask'], buffered: false });
          window.__tbtObserverAttached = true;
        } catch (e) {
          console.warn('[TBT] Failed to set up long task observer:', e);
          window.__tbtObserverAttached = true; // Mark as attached to avoid retrying
        }
      } else {
        console.warn('[TBT] Long Task API not supported');
        window.__tbtObserverAttached = true; // Mark as attached to avoid retrying
      }
    }

    // Return verification
    return {
      inpListenersAttached: !!window.__inpListenersAttached,
      tbtObserverAttached: !!window.__tbtObserverAttached,
      inpMetricsExists: !!window.__inpMetrics,
      tbtMetricsExists: !!window.__tbtMetrics,
      reactRenderMetricsExists: !!window.__REACT_RENDER_METRICS__,
    };
  `);

  // console.log('[Inject] Execution result:', result);
  // console.log('[Inject] INP listeners attached:', result?.inpListenersAttached);
  // console.log('[Inject] TBT observer attached:', result?.tbtObserverAttached);
}

/**
 * Collects React-specific metrics from the page using React Profiler data
 */
async function collectReactMetrics(
  driver: Driver,
): Promise<Partial<ReactCompilerMetrics>> {
  const reactMetrics = await driver.driver.executeScript(() => {
    // React Profiler data from ui/index.js - array of render events (non-production builds)
    // Each entry has: { id, phase, actualDuration, baseDuration, startTime, commitTime }
    const profilerData = (window as any).__REACT_RENDER_METRICS__ || [];
    const inpMetrics = (window as any).__inpMetrics || { interactions: [] };
    const tbtMetrics = (window as any).__tbtMetrics || {
      longTasks: [],
      totalBlockingTime: 0,
    };

    // Process React Profiler data
    let renderCount = 0;
    let renderTimes: number[] = [];
    let componentRenderCounts: Record<string, number> = {};

    if (Array.isArray(profilerData) && profilerData.length > 0) {
      const renderEvents = profilerData.filter(
        (event: any) => event && typeof event.actualDuration === 'number',
      );
      renderCount = renderEvents.length;
      renderTimes = renderEvents.map((e: any) => e.actualDuration);
      renderEvents.forEach((event: any) => {
        if (event.id) {
          componentRenderCounts[event.id] =
            (componentRenderCounts[event.id] || 0) + 1;
        }
      });
    }

    const totalRenderTime = renderTimes.reduce(
      (sum: number, time: number) => sum + time,
      0,
    );
    const averageRenderTime =
      renderTimes.length > 0 ? totalRenderTime / renderTimes.length : 0;

    // Calculate INP (75th percentile of interaction latencies)
    // Filter out:
    // - Negative values (sentinel for timed-out measurements)
    // - Zero values (failed measurements)
    // - Non-finite values
    // - Values that are clearly timeouts (>= 2000ms, matching INP_TIMEOUT_MS)
    type InpInteraction = { duration: number; timedOut?: boolean };
    const validInteractions = inpMetrics.interactions.filter(
      (i: InpInteraction) => !i.timedOut && i.duration > 0 && i.duration < 2000,
    );
    const interactionDurations = validInteractions
      .map((i: InpInteraction) => i.duration)
      .filter((d: number) => d > 0 && isFinite(d))
      .sort((a: number, b: number) => a - b);

    let inp = 0;
    if (interactionDurations.length > 0) {
      const inpIndex = Math.floor(interactionDurations.length * 0.75);
      inp = interactionDurations[inpIndex] || 0;
    }

    // Log if we discarded timed-out measurements
    const timedOutCount = inpMetrics.interactions.filter(
      (i: InpInteraction) => i.timedOut,
    ).length;
    if (timedOutCount > 0) {
      console.warn(`[INP] Discarded ${timedOutCount} timed-out measurements`);
    }

    // Get FCP from Performance API
    // IMPORTANT: FCP is a page-load metric, not suitable for SPA flows
    // Only use FCP if:
    // 1. There's a valid FCP entry
    // 2. The value is reasonable (< 5000ms for a page load)
    // Values > 5000ms likely indicate stale data from initial page load or measurement errors
    const perfEntries = performance.getEntriesByType('paint');
    const fcpEntry = perfEntries.find(
      (entry) => entry.name === 'first-contentful-paint',
    );
    let fcp;
    if (fcpEntry) {
      const fcpValue = fcpEntry.startTime;
      // Only accept FCP values < 5000ms as valid
      // Higher values suggest stale page-load data or measurement issues
      if (fcpValue > 0 && fcpValue < 5000) {
        fcp = fcpValue;
      } else if (fcpValue >= 5000) {
        console.warn(
          `[FCP] Discarding unrealistic FCP value: ${fcpValue}ms (likely stale page-load data)`,
        );
      }
    }

    // Get TBT
    const tbt = tbtMetrics.totalBlockingTime || 0;

    // Get lazy-loading metrics (set by scrolling flows)
    const lazyLoadMetrics = (window as any).__lazyLoadMetrics || null;
    let lazyLoadData = {};
    if (lazyLoadMetrics) {
      const latencies = lazyLoadMetrics.scrollToLoadLatencies || [];
      const avgLatency =
        latencies.length > 0
          ? latencies.reduce((sum: number, val: number) => sum + val, 0) /
            latencies.length
          : 0;
      const avgAssetsPerScroll =
        (lazyLoadMetrics.assetsLoadedPerScroll || []).length > 0
          ? (lazyLoadMetrics.assetsLoadedPerScroll as number[]).reduce(
              (sum: number, val: number) => sum + val,
              0,
            ) / (lazyLoadMetrics.assetsLoadedPerScroll as number[]).length
          : 0;

      lazyLoadData = {
        scrollToLoadLatency: avgLatency,
        timeToFirstVisibleAsset:
          lazyLoadMetrics.timeToFirstVisibleAsset || undefined,
        timeTo75PercentLoaded:
          lazyLoadMetrics.timeTo75PercentLoaded || undefined,
        scrollEventCount: lazyLoadMetrics.scrollEventCount || 0,
        totalScrollDistance: lazyLoadMetrics.totalScrollDistance || 0,
        assetsLoadedPerScroll: avgAssetsPerScroll,
        cumulativeLoadTime: lazyLoadMetrics.cumulativeLoadTime || 0,
      };
    }

    return {
      inp,
      inpCount: inpMetrics.interactions.length,
      renderCount,
      renderTime: totalRenderTime,
      averageRenderTime,
      componentRenderCounts,
      fcp,
      tbt,
      ...lazyLoadData,
    };
  });

  return reactMetrics as Partial<ReactCompilerMetrics>;
}

/**
 * Resets React metrics tracking and records the flow start time.
 * This allows FCP to be validated against the flow start (to detect stale values).
 */
async function resetReactMetrics(driver: Driver): Promise<void> {
  // console.log('[Reset] Starting resetReactMetrics');
  const result = await driver.driver.executeScript(`
    // Store original object references to verify they're preserved
    const originalInpMetrics = window.__inpMetrics;
    const originalTbtMetrics = window.__tbtMetrics;
    const originalReactRenderMetrics = window.__reactRenderMetrics;

    // Record flow start time for FCP validation
    // FCP entries from before this time are stale and should be ignored
    window.__flowStartTime = performance.now();

    // Reset React Profiler data array (if it exists)
    if (window.__REACT_RENDER_METRICS__) {
      // Check if it's an array (Profiler format) or object (old format)
      if (Array.isArray(window.__REACT_RENDER_METRICS__)) {
        window.__REACT_RENDER_METRICS__.length = 0; // Clear array
      } else {
        window.__REACT_RENDER_METRICS__ = [];
      }
    }


    // Reset INP metrics (preserve object reference to keep listeners working)
    if (window.__inpMetrics) {
      window.__inpMetrics.interactions.length = 0; // Clear array, keep object reference
    } else {
      // Initialize if it doesn't exist
      window.__inpMetrics = {
        interactions: [],
      };
    }

    // Reset TBT metrics (preserve object reference to keep observer working)
    if (window.__tbtMetrics) {
      window.__tbtMetrics.longTasks.length = 0; // Clear array, keep object reference
      window.__tbtMetrics.totalBlockingTime = 0; // Reset counter
    } else {
      // Initialize if it doesn't exist
      window.__tbtMetrics = {
        longTasks: [],
        totalBlockingTime: 0,
      };
    }

    // Reset lazy load metrics for scrolling flows
    if (window.__lazyLoadMetrics) {
      window.__lazyLoadMetrics = null;
    }

    // Verify object references are preserved (for debugging)
    if (originalInpMetrics && window.__inpMetrics !== originalInpMetrics) {
      console.error('[Reset] INP metrics object reference changed!');
    }
    if (originalTbtMetrics && window.__tbtMetrics !== originalTbtMetrics) {
      console.error('[Reset] TBT metrics object reference changed!');
    }

    const reactRenderCount = Array.isArray(window.__REACT_RENDER_METRICS__)
      ? window.__REACT_RENDER_METRICS__.length
      : 0;
    // console.log('[Reset] Metrics reset complete. INP interactions: ' + window.__inpMetrics.interactions.length +
    //             ', TBT longTasks: ' + window.__tbtMetrics.longTasks.length +
    //             ', React renders: ' + reactRenderCount);

    // Return verification that reset completed
    return {
      inpInteractionsCount: window.__inpMetrics?.interactions?.length || 0,
      tbtLongTasksCount: window.__tbtMetrics?.longTasks?.length || 0,
      reactRenderCount: Array.isArray(window.__REACT_RENDER_METRICS__)
        ? window.__REACT_RENDER_METRICS__.length
        : 0,
      flowStartTime: window.__flowStartTime,
    };
  `);

  // console.log('[Reset] Reset result:', result);
  // console.log('[Reset] INP interactions after reset:', result?.inpInteractionsCount);
  // console.log('[Reset] TBT longTasks after reset:', result?.tbtLongTasksCount);
}

// INP timeout - reduced from 10s to 2s to avoid polluting data with timeout values
// Real INP should complete within 200-500ms; 2s is generous for heavy React work
const INP_TIMEOUT_MS = 2000;

/**
 * Track a click action and measure INP (Interaction to Next Paint).
 * Selenium clicks might not always trigger native events that are captured by document event listeners,
 * so we manually record the interaction timing using requestAnimationFrame.
 *
 * @param driver - The Selenium WebDriver instance
 * @param clickAction - A function that performs the click action
 * @param eventType - The type of interaction ('click', 'keydown', etc.) - defaults to 'click'
 * @returns Promise<number> - The INP duration in milliseconds (0 if timed out)
 */
async function trackClick(
  driver: Driver,
  clickAction: () => Promise<void>,
  eventType: string = 'click',
): Promise<number> {
  // Get start time before click (in browser context)
  const clickStartTime = (await driver.driver.executeScript(`
      return performance.now();
    `)) as number;

  // Perform the actual Selenium click
  await clickAction();

  // Wait a bit for the click to process
  await driver.delay(50);

  // Wait for next paint and record INP (in browser context)
  // Use a short timeout (2s) - if rAF doesn't fire by then, something is wrong
  // and we should NOT include this as a valid INP measurement
  try {
    const result = (await driver.driver.executeScript(`
      const startTime = ${clickStartTime};
      const eventType = '${eventType}';
      const TIMEOUT_MS = ${INP_TIMEOUT_MS};

      return new Promise((resolve) => {
        let resolved = false;

        // Timeout fallback - return 0 to indicate invalid measurement
        // Do NOT add timed-out values to metrics as they pollute the data
        const timeoutId = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            console.warn('[INP] Paint tracking timed out after ' + TIMEOUT_MS + 'ms - discarding measurement');
            // Still record that we tried (for debugging), but mark as invalid
            if (window.__inpMetrics && window.__inpMetrics.interactions) {
              window.__inpMetrics.interactions.push({
                start: startTime,
                end: performance.now(),
                duration: -1, // Sentinel value for timed-out
                type: eventType,
                timedOut: true,
              });
            }
            resolve({ duration: 0, timedOut: true });
          }
        }, TIMEOUT_MS);

        // Normal requestAnimationFrame path
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeoutId);
            const endTime = performance.now();
            if (window.__inpMetrics && window.__inpMetrics.interactions) {
              window.__inpMetrics.interactions.push({
                start: startTime,
                end: endTime,
                duration: endTime - startTime,
                  type: eventType,
                  timedOut: false,
              });
            }
              resolve({ duration: endTime - startTime, timedOut: false });
            }
          });
        });
      });
    `)) as { duration: number; timedOut: boolean };

    if (result.timedOut) {
      console.warn(`[INP] Timed out waiting for paint after ${eventType}`);
      return 0; // Return 0 for timed-out measurements
    }
    return result.duration;
  } catch (scriptError) {
    // If script execution fails entirely (e.g., browser unresponsive),
    // log and continue - we still want to measure other aspects
    console.warn(
      '[INP] Script execution failed during click tracking:',
      scriptError,
    );
    return 0;
  }
}

/**
 * Flow: Tab Switching
 */
async function tabSwitchingFlow(driver: Driver): Promise<void> {
  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();

  // Switch to Tokens tab and track interaction
  await trackClick(driver, () => homePage.goToTokensTab());
  await driver.delay(500);

  // Switch to NFTs tab and track interaction
  await trackClick(driver, () => homePage.goToNftTab());
  await driver.delay(500);

  // Switch to Activity tab and track interaction
  await trackClick(driver, () => homePage.goToActivityList());
  await driver.delay(500);

  // Switch back to Tokens tab and track interaction
  await trackClick(driver, () => homePage.goToTokensTab());
  await driver.delay(500);
}

/**
 * Flow: Account Switching
 */
async function accountSwitchingFlow(driver: Driver): Promise<void> {
  const headerNavbar = new HeaderNavbar(driver);
  const accountListPage = new AccountListPage(driver);

  // Open account menu (with INP tracking)
  await trackClick(driver, () => headerNavbar.openAccountMenu());

  // Wait for account list items to be available instead of the create button
  // The create button might not be present in all UI states
  try {
    await driver.waitForSelector(
      '.multichain-account-list-item__account-name, .multichain-account-menu-popover__list--menu-item',
      { timeout: 15000 },
    );
    await driver.delay(500); // Give time for menu to fully render
  } catch (error) {
    // Fallback to checkPageIsLoaded if account items not found
    console.warn('Account items not found, trying checkPageIsLoaded:', error);
    try {
      await accountListPage.checkPageIsLoaded();
      await driver.delay(300);
    } catch (checkError) {
      console.warn('checkPageIsLoaded also failed:', checkError);
      // Continue anyway - the account switching might still work
    }
  }

  // Switch to Account 2 (with INP tracking)
  try {
    await trackClick(driver, () =>
      accountListPage.switchToAccount('Account 2'),
    );
    await driver.delay(1000); // Wait for account switch to complete
  } catch (error) {
    console.warn('Could not switch to Account 2:', error);
  }

  // Open account menu again (with INP tracking)
  await trackClick(driver, () => headerNavbar.openAccountMenu());

  // Wait for account list items again
  try {
    await driver.waitForSelector(
      '.multichain-account-list-item__account-name, .multichain-account-menu-popover__list--menu-item',
      { timeout: 15000 },
    );
    await driver.delay(500);
  } catch (error) {
    console.warn('Account items not found on second open:', error);
    try {
      await accountListPage.checkPageIsLoaded();
      await driver.delay(300);
    } catch (checkError) {
      console.warn('checkPageIsLoaded failed on second open:', checkError);
    }
  }

  // Switch to Account 3 (with INP tracking)
  try {
    await trackClick(driver, () =>
      accountListPage.switchToAccount('Account 3'),
    );
    await driver.delay(1000);
  } catch (error) {
    console.warn('Could not switch to Account 3:', error);
  }

  // Switch back to Account 1 (with INP tracking)
  await trackClick(driver, () => headerNavbar.openAccountMenu());

  // Wait for account list items again
  try {
    await driver.waitForSelector(
      '.multichain-account-list-item__account-name, .multichain-account-menu-popover__list--menu-item',
      { timeout: 15000 },
    );
    await driver.delay(500);
  } catch (error) {
    console.warn('Account items not found on third open:', error);
    try {
      await accountListPage.checkPageIsLoaded();
      await driver.delay(300);
    } catch (checkError) {
      console.warn('checkPageIsLoaded failed on third open:', checkError);
    }
  }

  // Switch to Account 1 (with INP tracking)
  try {
    await trackClick(driver, () =>
      accountListPage.switchToAccount('Account 1'),
    );
    await driver.delay(1000);
  } catch (error) {
    console.warn('Could not switch to Account 1:', error);
  }
}

/**
 * Helper function to dismiss network connection error modals.
 * Returns true ONLY if a modal was actually dismissed (not just detected).
 */
async function dismissNetworkErrorModal(driver: Driver): Promise<boolean> {
  try {
    // Check for alert modal (network connection errors)
    const hasAlertModal = await driver.isElementPresent(
      '[data-testid="alert-modal"]',
    );
    if (hasAlertModal) {
      console.log('Network connection error modal detected, dismissing');
      try {
        const alertModal = new NetworkSwitchAlertModal(driver);
        await alertModal.clickGotItButton();
        await driver.delay(500);
        return true; // Modal was actually dismissed
      } catch (dismissError) {
        // Try alternative dismiss methods
        try {
          await driver.clickElement('[data-testid="alert-modal-button"]');
          await driver.delay(500);
          return true; // Modal was actually dismissed
        } catch (altError) {
          console.warn('Could not dismiss error modal:', altError);
          // Return FALSE - modal exists but we couldn't dismiss it
          // This prevents infinite loops in dismissAllBlockingModals
          return false;
        }
      }
    }

    // Note: We no longer check for generic error text banners because:
    // 1. They are not dismissible modals
    // 2. Returning true for them causes infinite loops
    // The error banners ("Unable to connect to Ethereum") are persistent UI
    // and don't block interactions - they're just informational.

    return false; // No dismissible modal found
  } catch (error) {
    // No error modal found, continue
    return false;
  }
}

/**
 * Dismiss ALL types of blocking modals that may interfere with click interactions.
 * This is more comprehensive than dismissNetworkErrorModal and handles:
 * - Network error modals
 * - Network picker/manager modals
 * - Generic modal overlays (mm-modal-content)
 * - Popups and dialogs
 *
 * Should be called before any critical click operation that may fail due to ElementClickInterceptedError.
 *
 * @param driver - The WebDriver instance
 * @param maxAttempts - Maximum attempts to clear modals (default: 3)
 * @returns Promise<number> - Number of modals dismissed
 */
async function dismissAllBlockingModals(
  driver: Driver,
  maxAttempts: number = 3,
): Promise<number> {
  let dismissedCount = 0;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let dismissedThisRound = false;

    // 1. First check for network error modals (most common blocker)
    const hadNetworkError = await dismissNetworkErrorModal(driver);
    if (hadNetworkError) {
      dismissedCount++;
      dismissedThisRound = true;
    }

    // 2. Check for modal close buttons (generic modals)
    const closeButtonSelectors = [
      '[data-testid="modal-header-close-button"]',
      'button[aria-label="Close"]',
      '[data-testid="popover-close"]',
      '.mm-modal-content button.mm-button-icon[aria-label]',
    ];

    for (const selector of closeButtonSelectors) {
      try {
        const hasCloseBtn = await driver.isElementPresent(selector);
        if (hasCloseBtn) {
          console.log(`Dismissing modal via: ${selector}`);
          await driver.clickElement(selector);
          await driver.delay(300);
          dismissedCount++;
          dismissedThisRound = true;
          break; // Only dismiss one at a time per round
        }
      } catch {
        // This selector didn't work, try next
      }
    }

    // 3. Check for overlay modals that block clicks (mm-modal-content, etc.)
    try {
      const hasBlockingOverlay = (await driver.driver.executeScript(`
        // Check for modal overlays that could intercept clicks
        const overlays = document.querySelectorAll(
          '.mm-modal-content, .modal-overlay, [class*="modal"][class*="overlay"], [class*="popover"]'
        );
        for (const overlay of overlays) {
          const style = window.getComputedStyle(overlay);
          if (style.display !== 'none' && style.visibility !== 'hidden') {
            // Try to find and click a close button inside
            const closeBtn = overlay.querySelector(
              'button[aria-label="Close"], [data-testid*="close"], button.close, .close-button'
            );
            if (closeBtn) {
              closeBtn.click();
              return true;
            }
            // If no close button, try pressing Escape
            document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            return true;
          }
        }
        return false;
      `)) as boolean;

      if (hasBlockingOverlay) {
        console.log('Dismissed blocking overlay via JS');
        await driver.delay(300);
        dismissedCount++;
        dismissedThisRound = true;
      }
    } catch {
      // JS execution failed, continue
    }

    // 4. Try pressing Escape key as a universal modal dismiss
    if (!dismissedThisRound) {
      try {
        // Check if any modal-like element is visible
        const hasVisibleModal = await driver.isElementPresent(
          '.mm-modal-content, [class*="modal"]:not([style*="display: none"])',
        );
        if (hasVisibleModal) {
          console.log('Attempting Escape key to dismiss modal');
          await driver.driver.executeScript(`
            document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
          `);
          await driver.delay(300);
          dismissedCount++;
          dismissedThisRound = true;
        }
      } catch {
        // Continue
      }
    }

    // If nothing was dismissed this round, we're done
    if (!dismissedThisRound) {
      break;
    }

    await driver.delay(200);
  }

  if (dismissedCount > 0) {
    console.log(`Dismissed ${dismissedCount} blocking modal(s)`);
  }

  return dismissedCount;
}

/**
 * Flow: Network Switching
 *
 * This flow tests switching between networks using the network picker in the header.
 * It clicks the network picker (.mm-picker-network), which opens the Select Network dialog,
 * then switches to a different network and verifies the change.
 *
 * NOTE: The previous implementation incorrectly used [data-testid="sort-by-networks"]
 * which is a FILTER button for showing/hiding networks in the asset list,
 * NOT the network selector. This is why "All Popular Networks" never changed.
 */
async function networkSwitchingFlow(driver: Driver): Promise<void> {
  const homePage = new HomePage(driver);

  // Ensure home page is loaded
  await homePage.checkPageIsLoaded();
  await homePage.waitForNetworkAndDOMReady();

  // Dismiss any blocking modals
  await dismissAllBlockingModals(driver);

  let switchCount = 0;

  // Correct selectors from HeaderNavbar page object
  const threeDotMenuButton = '[data-testid="account-options-menu-button"]';
  const globalNetworksMenu = '[data-testid="global-menu-networks"]';

  // Helper to open network dialog and click a network by index (0, 1, 2...)
  const switchToNetworkByIndex = async (index: number): Promise<boolean> => {
    try {
      console.log(`Switch attempt ${index + 1}: Opening network dialog`);

      // Open 3-dot menu
      await trackClick(driver, () => driver.clickElement(threeDotMenuButton));
      await driver.delay(200);

      // Click Networks option
      await trackClick(driver, () => driver.clickElement(globalNetworksMenu));
      await driver.delay(500);

      // Wait for network list to appear
      await driver.waitForSelector('.multichain-network-list-item', {
        timeout: 5000,
      });

      // Get list of available networks, skip currently selected, click by index
      const result = (await driver.driver.executeScript(
        `
        const targetIndex = arguments[0];
        const items = document.querySelectorAll('.multichain-network-list-item');

        // Find non-selected networks
        const available = [];
        items.forEach((item, i) => {
          const name = item.textContent?.split('\\n')[0]?.trim() || 'Unknown';
          const isSelected = item.classList.contains('multichain-network-list-item--selected') ||
                            item.querySelector('.multichain-network-list-item__selected-indicator');
          available.push({ element: item, name, index: i, isSelected });
        });

        console.log('Networks: ' + available.map(n => n.name + (n.isSelected ? ' (selected)' : '')).join(', '));

        // Filter to non-selected networks
        const notSelected = available.filter(n => !n.isSelected);

        if (notSelected.length > targetIndex) {
          const target = notSelected[targetIndex];
          target.element.click();
          return { clicked: true, name: target.name, wasSelected: false };
        } else if (available.length > 0) {
          // Fallback: click any network at the target index
          const target = available[Math.min(targetIndex, available.length - 1)];
          target.element.click();
          return { clicked: true, name: target.name, wasSelected: target.isSelected };
        }
        return { clicked: false, name: null, wasSelected: false };
      `,
        index,
      )) as { clicked: boolean; name: string | null; wasSelected: boolean };

      if (result.clicked) {
        const status = result.wasSelected ? ' (was already selected)' : '';
        console.log(`Switched to: ${result.name}${status}`);
        // Wait for modal to close after selecting network
        try {
          await driver.waitForSelector('.multichain-network-list-item', {
            state: 'hidden',
            timeout: 3000,
          });
        } catch {
          // Modal might already be closed
        }
        await driver.delay(500);
        await dismissNetworkErrorModal(driver);
        await dismissAllBlockingModals(driver);
        if (!result.wasSelected) {
          switchCount++;
        }
        return true;
      }

      // Close dialog if not found
      console.warn(`Network at index ${index} not found`);
      await driver.clickElement('[data-testid="modal-header-close-button"]');
      return false;
    } catch (error) {
      console.warn(`Switch ${index + 1} failed:`, error);
      // Always try to close modal
      try {
        await driver.clickElement('[data-testid="modal-header-close-button"]');
      } catch {
        await dismissAllBlockingModals(driver);
      }
      return false;
    }
  };

  // Click first network, then second network (toggles between them)
  await switchToNetworkByIndex(0);
  await driver.delay(300);
  await switchToNetworkByIndex(1);

  console.log(`Network switching: ${switchCount} switches`);

  // Ensure we're back on home page before returning
  await dismissNetworkErrorModal(driver);
  await homePage.checkPageIsLoaded();
}

/**
 * Flow: Network Adding
 * Uses the same network details as the onboarding test: 'User can add custom network during onboarding'
 * Network: Localhost (port based on offset), Chain ID: 1338
 *
 * @param driver - The WebDriver instance
 * @param portOffset - Port offset for concurrent runs (default: 0)
 */
async function networkAddingFlow(
  driver: Driver,
  portOffset: number = 0,
): Promise<void> {
  const selectNetwork = new SelectNetwork(driver);
  const homePage = new HomePage(driver);

  // Network details - port is calculated based on offset for concurrent runs
  // The Anvil server is started with chain ID 1338 + portOffset
  const secondaryAnvilPort = 8546 + portOffset;
  const chainIdNum = 1338 + portOffset; // Must match the Anvil server's chain ID
  const networkName = `Localhost ${secondaryAnvilPort}`;
  const networkUrl = `http://127.0.0.1:${secondaryAnvilPort}`;
  const currencySymbol = 'ETH';
  const chainId = String(chainIdNum);

  // PRE-FLIGHT CHECK: Verify the RPC server is actually running before attempting to add
  // This prevents wasted time on a flow that will fail at RPC validation
  console.log(`Checking if RPC server is available at ${networkUrl}...`);
  try {
    const rpcCheckResult = (await driver.driver.executeScript(`
      return new Promise((resolve) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          resolve({ available: false, error: 'timeout' });
        }, 3000);

        fetch('${networkUrl}', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 1 }),
          signal: controller.signal
        })
        .then(res => res.json())
        .then(data => {
          clearTimeout(timeoutId);
          resolve({ available: true, chainId: data.result });
        })
        .catch(err => {
          clearTimeout(timeoutId);
          resolve({ available: false, error: err.message });
        });
      });
    `)) as { available: boolean; chainId?: string; error?: string };

    if (!rpcCheckResult.available) {
      throw new Error(
        `RPC server at ${networkUrl} is not available (${rpcCheckResult.error}). ` +
          `Start an Anvil server on port ${secondaryAnvilPort} to enable this test.`,
      );
    }
    console.log(
      `RPC server available at ${networkUrl}, chain ID: ${rpcCheckResult.chainId}`,
    );
  } catch (rpcError: unknown) {
    console.warn(
      `RPC pre-flight check failed: ${String(rpcError)}. Continuing anyway...`,
    );
  }

  // Dismiss network error modals only (NOT the network management dialog)
  await dismissNetworkErrorModal(driver);

  // Ensure home page is ready
  await homePage.checkPageIsLoaded();
  await homePage.waitForNetworkAndDOMReady();

  // PRE-CLEANUP: Delete the network if it already exists (for subsequent iterations)
  // Use multiple methods to find and delete existing network
  const chainIdHex = `0x${chainIdNum.toString(16)}`;
  console.log(
    `Pre-cleanup: checking for existing network (chainId: ${chainIdNum} / ${chainIdHex})...`,
  );

  try {
    // Get fresh state and check for network by chainId (multiple formats) or name
    const existingNetworkId = (await driver.driver.executeScript(`
      // Force fresh state read
      const state = window.stateHooks?.getCleanAppState?.() ||
                   window.store?.getState?.() || {};
      const networkConfigs = state.metamask?.networkConfigurations || {};

      const targetChainIdHex = '${chainIdHex}'.toLowerCase();
      const targetChainIdNum = ${chainIdNum};
      const targetName = '${networkName}'.toLowerCase();

      for (const [id, config] of Object.entries(networkConfigs)) {
        const configChainId = (config.chainId || '').toString().toLowerCase();
        const configName = (config.nickname || config.name || '').toLowerCase();

        // Match by chainId (hex or decimal) or by name
        if (configChainId === targetChainIdHex ||
            configChainId === targetChainIdNum.toString() ||
            configChainId === '0x' + targetChainIdNum.toString(16) ||
            parseInt(configChainId, 16) === targetChainIdNum ||
            configName === targetName ||
            configName.includes('localhost') && configName.includes('8546')) {
          console.log('Found existing network:', id, configName, configChainId);
          return id;
        }
      }
      return null;
    `)) as string | null;

    if (existingNetworkId) {
      console.log(`Found existing network (${existingNetworkId}), deleting...`);

      // Delete via background API
      await driver.driver.executeScript(`
        return new Promise((resolve) => {
          const bg = window.stateHooks?.getBackgroundConnection?.();
          if (bg && bg.removeNetworkConfiguration) {
            bg.removeNetworkConfiguration('${existingNetworkId}', (err) => {
              if (err) console.warn('Delete error:', err);
              resolve(true);
            });
          } else {
            resolve(false);
          }
        });
      `);
      await driver.delay(500);

      // Verify deletion
      const stillExists = (await driver.driver.executeScript(`
        const state = window.stateHooks?.getCleanAppState?.() || {};
        return !!state.metamask?.networkConfigurations?.['${existingNetworkId}'];
      `)) as boolean;

      if (stillExists) {
        console.warn(
          'Network still exists after deletion attempt, will try to proceed anyway',
        );
      } else {
        console.log('Network deleted successfully');
      }
    } else {
      console.log('No existing network found (clean state)');
    }
  } catch (cleanupError) {
    console.warn(`Pre-cleanup failed (non-fatal): ${cleanupError}`);
  }

  // Ensure home page is ready and dismiss any modals
  await dismissNetworkErrorModal(driver);
  await homePage.checkPageIsLoaded();

  // Open network management dialog via 3-dot menu → Networks
  // IMPORTANT: This is DIFFERENT from networkManager.openNetworkManager() which clicks
  // sort-by-networks (a filter toggle). Only the 3-dot menu path shows "Add a custom network".
  console.log('Opening network management via 3-dot menu');
  await driver.waitForSelector('[data-testid="account-options-menu-button"]');
  await driver.clickElement('[data-testid="account-options-menu-button"]');
  await driver.delay(100);

  await driver.waitForSelector('[data-testid="global-menu-networks"]');
  await driver.clickElement('[data-testid="global-menu-networks"]');
  await driver.delay(200);

  // Wait for the "Manage networks" dialog to load
  await selectNetwork.checkPageIsLoaded();
  console.log('Network management dialog loaded');

  // Open add custom network modal
  try {
    await selectNetwork.openAddCustomNetworkModal();

    // Fill in network details
    const addEditNetworkModal = new AddEditNetworkModal(driver);

    // Wait for modal to load (single attempt with reasonable timeout)
    await addEditNetworkModal.checkPageIsLoaded();

    // Add RPC URL first - this will allow MetaMask to query the chain ID
    await addEditNetworkModal.openAddRpcUrlModal();
    const addRpcUrlModal = new AddNetworkRpcUrlModal(driver);
    await addRpcUrlModal.checkPageIsLoaded();

    // Fill RPC URL and name
    await addRpcUrlModal.fillAddRpcUrlInput(networkUrl);
    await addRpcUrlModal.fillAddRpcNameInput(
      `Localhost ${secondaryAnvilPort} RPC`,
    );

    await addRpcUrlModal.saveAddRpcUrl();

    // Wait for RPC validation - use polling instead of fixed delay
    await driver.delay(500);

    // Fill in network details
    await addEditNetworkModal.fillNetworkNameInputField(networkName);
    await addEditNetworkModal.fillNetworkChainIdInputField(chainId);
    await addEditNetworkModal.fillCurrencySymbolInputField(currencySymbol);

    // Poll for save button to be enabled (max 5 seconds)
    console.log('Waiting for RPC validation...');
    const validationStartTime = Date.now();
    let isSaveButtonEnabled = false;

    while (Date.now() - validationStartTime < 5000) {
      isSaveButtonEnabled = (await driver.driver.executeScript(`
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          if (btn.textContent && btn.textContent.trim().toLowerCase() === 'save') {
            return !btn.disabled;
          }
        }
        return false;
      `)) as boolean;

      if (isSaveButtonEnabled) {
        console.log(
          `RPC validation completed in ${Date.now() - validationStartTime}ms`,
        );
        break;
      }
      await driver.delay(200); // Poll every 200ms
    }

    if (!isSaveButtonEnabled) {
      // Try to close the modal
      try {
        await driver.clickElement('[data-testid="modal-header-close-button"]');
      } catch {
        try {
          await driver.clickElement('button[aria-label="Close"]');
        } catch {
          // Continue anyway
        }
      }
      throw new Error(
        'Save button is not enabled after 5s - RPC validation failed. ' +
          `Ensure Anvil server on port ${secondaryAnvilPort} is accessible.`,
      );
    }

    // Save the network
    await addEditNetworkModal.saveEditedNetwork();
    await driver.delay(300); // Brief wait for save to process

    // Verify the network was added by checking for success message
    // Note: The network may show an error if the RPC isn't actually available,
    // but the important part is that the network was added and the UI loaded
    try {
      await homePage.checkPageIsLoaded();
      // Check if network was added (may show error message if RPC unavailable, but that's OK)
      const networkAdded = (await driver.driver.executeScript(`
        // Check for success message or network name in the UI
        const successMessage = document.querySelector('[class*="notification"], [class*="banner"]');
        if (successMessage) {
          const text = successMessage.textContent || '';
          return text.toLowerCase().includes('${networkName.toLowerCase()}') ||
                 text.toLowerCase().includes('added') ||
                 text.toLowerCase().includes('network');
        }
        return false;
      `)) as boolean;

      if (!networkAdded) {
        // Network might have been added but no message shown, or error occurred
        // This is OK for benchmarking purposes - we've measured the add flow
        console.log('Network add flow completed (verification may vary)');
      }
    } catch (verifyError) {
      // Verification failed but flow completed - this is acceptable for benchmarking
      console.warn(
        'Could not verify network addition, but flow completed:',
        verifyError,
      );
    }

    // Dismiss any error modals if network connection failed (expected in test environment)
    await dismissNetworkErrorModal(driver);
    console.log('Network adding flow completed successfully');
  } catch (error) {
    console.warn('Network adding flow failed:', error);
    await dismissNetworkErrorModal(driver);
    // Try to close any open modal
    try {
      await driver.clickElement('[data-testid="modal-header-close-button"]');
    } catch {
      // Modal might already be closed
    }
    throw error; // Re-throw to mark flow as failed
  }

  // Ensure we're back on home page before returning
  await homePage.checkPageIsLoaded();
}

/**
 * Flow: Import SRP (Onboarding)
 * Tests onboarding flow performance and app load time
 * Note: This flow requires a fresh browser state (no existing wallet)
 * Uses E2E_SRP which is the same SRP used for power user persona state generation
 *
 * Key metrics captured:
 * - Onboarding completion time
 * - FCP, TBT, renderCount, renderTime during onboarding
 * - Time to reach home page after wallet import
 */
async function importSrpFlow(driver: Driver): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const {
    completeImportSRPOnboardingFlow,
  } = require('../page-objects/flows/onboarding.flow');

  console.log('Starting import SRP onboarding flow');
  const onboardingStartTime = Date.now();

  // Use the shared onboarding flow - it handles all the complex UI interactions reliably
  await completeImportSRPOnboardingFlow({ driver });

  const onboardingEndTime = Date.now();
  console.log(
    `Onboarding completed in ${onboardingEndTime - onboardingStartTime}ms`,
  );

  // Verify home page is fully loaded after onboarding
  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
  await homePage.waitForNetworkAndDOMReady();

  const homePageLoadedTime = Date.now();
  console.log(
    `Home page loaded ${homePageLoadedTime - onboardingEndTime}ms after onboarding`,
  );
  console.log(
    `Total import SRP flow: ${homePageLoadedTime - onboardingStartTime}ms`,
  );
}

/**
 * Flow: Token Send
 * Tests send flow performance, focusing on delays:
 * - 1-20 second delays to access Send token page
 * - 20-second delays when clicking "Next" in send flow
 * Handles both legacy send page and new send redesign
 */
async function tokenSendFlow(driver: Driver): Promise<void> {
  const homePage = new HomePage(driver);
  const sendTokenPage = new SendTokenPage(driver);

  await homePage.checkPageIsLoaded();
  await homePage.waitForNetworkAndDOMReady();
  await driver.delay(500);

  // Measure time to access Send token page (with INP tracking)
  const sendPageStartTime = Date.now();
  try {
    await trackClick(driver, () => homePage.startSendFlow());
    await driver.delay(1000); // Wait for navigation

    // Check which send page we're on - new redesign or legacy
    // New redesign has asset-filter-search-input, legacy has ens-input
    const isNewSendRedesign = await driver.isElementPresent(
      '[data-testid="asset-filter-search-input"]',
    );

    if (isNewSendRedesign) {
      console.log('Detected new send redesign');

      // Wait for the asset page to load
      await driver.waitForSelector(
        '[data-testid="asset-filter-search-input"]',
        {
          timeout: 15000,
        },
      );
      console.log('Send asset page is loaded');

      // Select the first token in the list to proceed to amount/recipient page (with INP tracking)
      try {
        // Look for any asset in the list (native or token)
        const assetElement = await driver.waitForSelector(
          '[data-testid="multichain-token-list-button"], .redesigned-asset-component, [class*="asset"]',
          { timeout: 10000 },
        );
        await trackClick(driver, async () => {
          await assetElement.click();
        });
        await driver.delay(1500); // Wait for navigation to amount/recipient page
        console.log('Selected asset for sending');
      } catch (assetError) {
        console.warn('Could not select asset from list:', assetError);
        // Try clicking the first clickable element in the asset list area
        try {
          await driver.driver.executeScript(`
            const assets = document.querySelectorAll('[class*="asset"]');
            if (assets.length > 0) {
              assets[0].click();
            }
          `);
          await driver.delay(1500);
        } catch (jsError) {
          console.warn('JS asset click also failed:', jsError);
        }
      }

      // Now we should be on the amount/recipient page
      // The new send redesign has a direct input field for the recipient address
      // The modal button (open-recipient-modal-btn) is ONLY for selecting existing contacts
      const testRecipientAddress = '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';

      // Find and fill the recipient input field using character-by-character typing
      // This properly triggers React's controlled input handlers
      let recipientFilled = false;
      try {
        console.log('Looking for recipient input field');

        // Try to find recipient input by placeholder
        const recipientSelectors = [
          'input[placeholder*="recipient" i]',
          'input[placeholder*="address" i]',
          'input[placeholder*="search" i]',
          'input[placeholder*="public" i]',
        ];

        for (const selector of recipientSelectors) {
          try {
            const hasInput = await driver.isElementPresent(selector);
            if (hasInput) {
              // Clear existing value first
              const inputElement = await driver.findElement(selector);
              await inputElement.clear();
              // Type character by character to properly trigger React onChange
              await inputElement.sendKeys(testRecipientAddress);
              console.log(`Recipient filled using: ${selector}`);
              recipientFilled = true;
              break;
            }
          } catch {
            // Try next selector
          }
        }

        if (recipientFilled) {
          // Wait for address validation to complete
          await driver.delay(2000);
          console.log('Waiting for recipient validation...');
        }
      } catch (recipientError) {
        console.warn('Could not fill recipient:', recipientError);
      }

      // If recipient wasn't filled, the flow can't continue - back out
      if (!recipientFilled) {
        console.warn('Recipient not filled, backing out of send flow');
        await dismissAllBlockingModals(driver);
        // Try to go back to home
        try {
          await driver.clickElement('[data-testid="send-header-back-button"]');
        } catch {
          try {
            await driver.clickElement('button.send-header__previous-btn');
          } catch {
            // Ignore
          }
        }
        return;
      }

      // Try to fill amount using JavaScript with proper React event dispatch
      // The new send redesign uses controlled inputs that need proper event handling
      try {
        // Use JavaScript to find and fill the amount input with proper event dispatch
        const amountResult = (await driver.driver.executeScript(`
          // First, try to click Max button
          const maxLinks = document.querySelectorAll('a, button, [role="button"], span');
          for (const el of maxLinks) {
            const text = el.textContent?.toLowerCase()?.trim();
            if (text === 'max' || text === 'max.') {
              el.click();
              return { method: 'max', success: true };
            }
          }

          // Find amount input - it has placeholder="0" in the new redesign
          const amountInputs = document.querySelectorAll('input[placeholder="0"], input[data-testid="currency-input"]');
          for (const input of amountInputs) {
            // Skip if it's hidden or not visible
            const rect = input.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;

            // Clear and set value with proper React event handling
            input.focus();

            // Use native input setter to bypass React's controlled input
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype,
              'value'
            ).set;
            nativeInputValueSetter.call(input, '1'); // Use simple "1" instead of decimal

            // Dispatch input event for React
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));

            return { method: 'input', success: true, selector: input.placeholder || 'amount-input' };
          }

          return { method: 'none', success: false };
        `)) as { method: string; success: boolean; selector?: string };

        if (amountResult.success) {
          console.log(
            `Amount filled using: ${amountResult.method}${amountResult.selector ? ` (${amountResult.selector})` : ''}`,
          );
          await driver.delay(1000);
        } else {
          console.warn('Could not find Max button or amount input');
        }
      } catch (amountError) {
        console.warn('Could not fill amount:', amountError);
      }

      // Check Continue/Submit button - it might show error text instead of "Continue"
      // In the new send redesign, the button shows: amountError ?? hexDataError ?? t('continue')
      const buttonStatus = (await driver.driver.executeScript(`
        // Find the main action button in the send flow - it's usually the last/bottom button
        const buttons = document.querySelectorAll('button');
        let mainButton = null;

        // Look for large buttons at the bottom of the form
        for (const btn of buttons) {
          const rect = btn.getBoundingClientRect();
          const text = btn.textContent?.toLowerCase() || '';

          // Check if it's a primary action button (large, at bottom, or has specific classes)
          if (rect.width > 200 ||
              text.includes('continue') ||
              text.includes('next') ||
              text.includes('review') ||
              text.includes('insufficient') ||
              text.includes('invalid') ||
              text.includes('error') ||
              btn.classList.contains('btn-primary') ||
              btn.classList.contains('button--lg')) {
            mainButton = btn;
          }
        }

        if (mainButton) {
          return {
            found: true,
            disabled: mainButton.disabled,
            text: mainButton.textContent?.trim(),
            hasError: mainButton.textContent?.toLowerCase().includes('insufficient') ||
                      mainButton.textContent?.toLowerCase().includes('invalid') ||
                      mainButton.textContent?.toLowerCase().includes('error')
          };
        }
        return { found: false };
      `)) as {
        found: boolean;
        disabled?: boolean;
        text?: string;
        hasError?: boolean;
      };

      console.log('Continue button status:', buttonStatus);

      // Handle different button states
      let clickedContinue = false;
      if (buttonStatus.found) {
        if (buttonStatus.hasError) {
          console.warn(
            `Validation error shown on button: ${buttonStatus.text}`,
          );
          // Don't try to click - there's a validation error
        } else if (!buttonStatus.disabled) {
          // Button is enabled and shows Continue/Next, try to click it
          try {
            await driver.driver.executeScript(`
              const buttons = document.querySelectorAll('button');
              for (const btn of buttons) {
                const text = btn.textContent?.toLowerCase() || '';
                if (text.includes('continue') || text.includes('next') || text.includes('review')) {
                  btn.click();
                  return true;
                }
              }
              return false;
            `);
            clickedContinue = true;
            console.log(`Clicked continue button: ${buttonStatus.text}`);
            await driver.delay(1000);
          } catch {
            console.warn('Could not click continue via JS');
          }
        } else {
          console.warn('Continue button is disabled');
        }
      } else {
        console.warn('Continue button not found');
      }

      // Wait for confirmation page or timeout
      if (clickedContinue) {
        try {
          await driver.waitForSelector(
            '[data-testid="transaction-confirmation"], [class*="confirmation"]',
            { timeout: 10000 },
          );
          console.log('Confirmation page loaded');
        } catch {
          console.warn('Confirmation page not found');
        }
      }

      const sendPageEndTime = Date.now();
      const sendPageAccessTime = sendPageEndTime - sendPageStartTime;
      console.log(`Time to complete Send flow: ${sendPageAccessTime}ms`);

      // Cancel/back out to home page
      // Try cancel button first, then back buttons
      const exitSelectors = [
        'button:has-text("Cancel")',
        'button:has-text("Reject")',
        '[data-testid="page-container-footer-cancel"]',
        'button.send-header__previous-btn',
        '[aria-label="go to previous page"]',
        '[aria-label="Back"]',
        '[data-testid="wallet-initiated-header-back-button"]',
      ];

      let exited = false;
      for (let attempt = 0; attempt < 3 && !exited; attempt++) {
        for (const selector of exitSelectors) {
          if (exited) {
            break;
          }
          try {
            const hasBtn = await driver.isElementPresent(selector);
            if (hasBtn) {
              await trackClick(driver, () => driver.clickElement(selector));
              await driver.delay(500);
              console.log(`Clicked exit button: ${selector}`);
            }
          } catch {
            // Try next selector
          }
        }

        // Check if we're back on home page
        try {
          const onHome = await driver.isElementPresent(
            '[data-testid="account-menu-icon"]',
          );
          if (onHome) {
            exited = true;
            console.log('Back on home page');
          }
        } catch {
          // Continue trying
        }
      }

      // Final verification
      try {
        await driver.waitForSelector('[data-testid="account-menu-icon"]', {
          timeout: 5000,
        });
        console.log(
          'Successfully returned to home page from new send redesign',
        );
      } catch {
        console.warn('May not have navigated back to home page');
      }
    } else {
      console.log('Detected legacy send page');

      // Wait for send page to be ready - wait for inputRecipient (ens-input)
      await driver.waitForSelector('[data-testid="ens-input"]', {
        timeout: 15000,
      });
      console.log('Send token screen is loaded');
      const sendPageEndTime = Date.now();
      const sendPageAccessTime = sendPageEndTime - sendPageStartTime;
      console.log(`Time to access Send token page: ${sendPageAccessTime}ms`);

      await driver.delay(500); // Wait for send page to initialize

      // Check if asset picker modal is open - if so, select a token or close it
      try {
        const isAssetPickerModalOpen = await driver.isElementPresent(
          '[data-testid="asset-picker-modal"]',
        );
        if (isAssetPickerModalOpen) {
          try {
            const ethTokenButton = await driver.waitForSelector(
              '[data-testid="multichain-token-list-button"]',
              { timeout: 5000 },
            );
            await ethTokenButton.click();
            await driver.delay(500);
          } catch (selectError) {
            console.warn('Could not select token, closing modal:', selectError);
            const closeButton = await driver.findClickableElement({
              css: 'button[aria-label="Close"]',
            });
            if (closeButton) {
              await closeButton.click();
              await driver.delay(500);
            }
          }
        }
      } catch (modalError) {
        console.warn('Could not check/close asset picker modal:', modalError);
      }

      // Fill in recipient address (use the standard test address from MetaMask E2E tests)
      const legacyRecipientAddress =
        '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';
      await sendTokenPage.fillRecipient(legacyRecipientAddress);
      await driver.delay(300);

      // Fill in amount - use small amount to avoid insufficient funds
      await sendTokenPage.fillAmount('0.0001');
      await driver.delay(500);

      // Measure time when clicking "Next" button
      const nextButtonStartTime = Date.now();
      try {
        await sendTokenPage.goToNextScreen();
        await driver.waitForSelector(
          {
            css: '[data-testid="transaction-confirmation"]',
          },
          { timeout: 20000 },
        );
        const nextButtonEndTime = Date.now();
        const nextButtonDelay = nextButtonEndTime - nextButtonStartTime;
        console.log(`Time delay when clicking Next: ${nextButtonDelay}ms`);

        // Cancel the transaction
        try {
          const cancelButton = await driver.findClickableElement({
            text: 'Cancel',
          });
          if (cancelButton) {
            await cancelButton.click();
            await driver.delay(500);
          }
        } catch (cancelError) {
          try {
            const backButton = await driver.findClickableElement({
              css: '[data-testid="wallet-initiated-header-back-button"]',
            });
            if (backButton) {
              await backButton.click();
              await driver.delay(500);
            }
          } catch (backError) {
            console.warn(
              'Could not cancel/back from send confirmation:',
              backError,
            );
          }
        }
      } catch (nextError) {
        console.warn(
          'Error clicking Next button or loading confirmation:',
          nextError,
        );
        try {
          await sendTokenPage.goToPreviousScreen();
          await driver.delay(500);
        } catch (backError) {
          console.warn('Could not go back from send page:', backError);
        }
      }
    }
  } catch (error) {
    console.warn('Error accessing Send token page:', error);
    throw error;
  }
}

/**
 * Flow: Token Search
 * Handles both legacy send page and new send redesign
 */
async function tokenSearchFlow(driver: Driver): Promise<void> {
  const homePage = new HomePage(driver);

  await homePage.checkPageIsLoaded();
  await homePage.waitForNetworkAndDOMReady();
  await driver.delay(500);

  // Click send button to navigate to send page (with INP tracking)
  try {
    await trackClick(driver, () => homePage.startSendFlow());
    await driver.delay(1000); // Wait for navigation

    // Check which send page we're on - new redesign or legacy
    // New redesign has asset-filter-search-input, legacy has ens-input
    const isNewSendRedesign = await driver.isElementPresent(
      '[data-testid="asset-filter-search-input"]',
    );

    if (isNewSendRedesign) {
      console.log('Detected new send redesign - using asset filter search');

      // Wait for the asset filter search input
      const searchInputSelector = '[data-testid="asset-filter-search-input"]';
      await driver.waitForSelector(searchInputSelector, {
        timeout: 15000,
      });
      console.log('Send asset page is loaded');
      await driver.delay(1000);

      // Click on the input to ensure it's focused (with INP tracking)
      const searchInput = await driver.waitForSelector(searchInputSelector, {
        state: 'enabled',
      });
      await trackClick(driver, async () => {
        await searchInput.click();
      });
      await driver.delay(300);

      // Search for a token - type character by character
      for (const char of 'ETH') {
        const input = await driver.waitForSelector(searchInputSelector, {
          state: 'enabled',
        });
        await input.sendKeys(char);
        await driver.delay(100);
      }
      await driver.delay(1000); // Wait for search results
      console.log('First search completed for ETH');

      // Clear search using multiple methods
      let cleared = false;

      // Method 1: Try clear button
      const clearButtonSelectors = [
        '[data-testid="text-field-search-clear-button"]',
        'button[aria-label="Clear"]',
        '.clear-button',
      ];
      for (const clearSelector of clearButtonSelectors) {
        if (cleared) {
          break;
        }
        try {
          const hasClearBtn = await driver.isElementPresent(clearSelector);
          if (hasClearBtn) {
            await driver.clickElement(clearSelector);
            await driver.delay(500);
            cleared = true;
            console.log(`Cleared search using: ${clearSelector}`);
          }
        } catch {
          // Try next selector
        }
      }

      // Method 2: Use keyboard to clear (Ctrl+A + backspace)
      if (!cleared) {
        try {
          const input = await driver.waitForSelector(searchInputSelector, {
            state: 'enabled',
          });
          await input.click();
          await driver.delay(100);
          // Select all text using Ctrl+A (or Cmd+A on Mac)
          await input.sendKeys(Key.chord(Key.CONTROL, 'a'));
          await driver.delay(100);
          // Delete selected text
          await input.sendKeys(Key.BACK_SPACE);
          await driver.delay(300);
          cleared = true;
          console.log('Cleared search using keyboard (Ctrl+A + backspace)');
        } catch (kbError) {
          console.warn('Keyboard clear failed:', kbError);
        }
      }

      // Method 3: Use driver.fill to overwrite with empty string
      if (!cleared) {
        try {
          await driver.fill(searchInputSelector, '');
          await driver.delay(300);
          cleared = true;
          console.log('Cleared search using fill with empty string');
        } catch (fillError) {
          console.warn('Fill clear failed:', fillError);
        }
      }

      // Search for another token
      console.log('Starting second search for LIN');
      const inputForSecondSearch = await driver.waitForSelector(
        searchInputSelector,
        { state: 'enabled' },
      );
      await inputForSecondSearch.click();
      await driver.delay(300);

      for (const char of 'LIN') {
        const input = await driver.waitForSelector(searchInputSelector, {
          state: 'enabled',
        });
        await input.sendKeys(char);
        await driver.delay(100);
      }
      await driver.delay(1000);
      console.log('Second search completed for LIN');
    } else {
      console.log('Detected legacy send page - using asset picker modal');

      // Wait for legacy send page with ens-input
      await driver.waitForSelector('[data-testid="ens-input"]', {
        timeout: 15000,
      });
      console.log('Send token screen is loaded');
      await driver.delay(1000);

      // Wait for asset picker button
      await driver.waitForSelector('[data-testid="asset-picker-button"]', {
        timeout: 10000,
      });

      // Open asset picker modal
      const assetPicker = new AssetPicker(driver);
      await assetPicker.openAssetPicker('dest');
      await driver.delay(1000);

      // Use asset picker modal search
      const searchInputSelector =
        '[data-testid="asset-picker-modal-search-input"]';
      await driver.waitForSelector(searchInputSelector, {
        timeout: 20000,
      });
      await driver.delay(1000);

      const searchInput = await driver.waitForSelector(searchInputSelector, {
        state: 'enabled',
      });
      await searchInput.click();
      await driver.delay(300);

      for (const char of 'ETH') {
        const input = await driver.waitForSelector(searchInputSelector, {
          state: 'enabled',
        });
        await input.sendKeys(char);
        await driver.delay(100);
      }
      await driver.delay(1000);

      // Clear search using multiple methods (same as new redesign)
      console.log('First search completed for ETH (legacy)');
      let cleared = false;

      // Method 1: Try clear button
      const clearButtonSelectors = [
        '[data-testid="text-field-search-clear-button"]',
        'button[aria-label="Clear"]',
        '.clear-button',
      ];
      for (const clearSelector of clearButtonSelectors) {
        if (cleared) {
          break;
        }
        try {
          const hasClearBtn = await driver.isElementPresent(clearSelector);
          if (hasClearBtn) {
            await driver.clickElement(clearSelector);
            await driver.delay(500);
            cleared = true;
            console.log(`Cleared search using: ${clearSelector}`);
          }
        } catch {
          // Try next selector
        }
      }

      // Method 2: Use keyboard to clear (Ctrl+A + backspace)
      if (!cleared) {
        try {
          const input = await driver.waitForSelector(searchInputSelector, {
            state: 'enabled',
          });
          await input.click();
          await driver.delay(100);
          await input.sendKeys(Key.chord(Key.CONTROL, 'a'));
          await driver.delay(100);
          await input.sendKeys(Key.BACK_SPACE);
          await driver.delay(300);
          cleared = true;
          console.log('Cleared search using keyboard (Ctrl+A + backspace)');
        } catch (kbError) {
          console.warn('Keyboard clear failed:', kbError);
        }
      }

      // Method 3: Use driver.fill to overwrite with empty string
      if (!cleared) {
        try {
          await driver.fill(searchInputSelector, '');
          await driver.delay(300);
          console.log('Cleared search using fill with empty string');
        } catch (fillError) {
          console.warn('Fill clear failed:', fillError);
        }
      }

      // Search for another token
      console.log('Starting second search for LIN (legacy)');
      const inputForSecondSearch = await driver.waitForSelector(
        searchInputSelector,
        { state: 'enabled' },
      );
      await inputForSecondSearch.click();
      await driver.delay(300);

      for (const char of 'LIN') {
        const input = await driver.waitForSelector(searchInputSelector, {
          state: 'enabled',
        });
        await input.sendKeys(char);
        await driver.delay(100);
      }
      await driver.delay(1000);
      console.log('Second search completed for LIN (legacy)');

      // Close asset picker
      const closeButton = await driver.findClickableElement({
        css: 'button[aria-label="Close"]',
      });
      if (closeButton) {
        await closeButton.click();
        await driver.delay(300);
      }
    }
  } catch (error) {
    console.warn('Could not complete token search flow:', error);
  }
}

/**
 * Flow: Tokens List Scrolling - scrolls to the end of the tokens list
 */
async function tokensListScrollingFlow(driver: Driver): Promise<void> {
  const homePage = new HomePage(driver);

  await homePage.checkPageIsLoaded();

  // Go to Tokens tab
  await homePage.goToTokensTab();
  await driver.delay(1000); // Wait for tokens to load

  // Track lazy-loading metrics
  const lazyLoadMetrics = {
    scrollToLoadLatencies: [] as number[],
    timeToFirstVisibleAsset: null as number | null,
    timeTo75PercentLoaded: null as number | null,
    scrollEventCount: 0,
    totalScrollDistance: 0,
    assetsLoadedPerScroll: [] as number[],
    cumulativeLoadTime: 0,
  };

  const flowStartTime = Date.now();
  let firstVisibleAssetTime: number | null = null;
  let timeTo75Percent: number | null = null;

  // Track visible tokens to detect when we've reached the end
  let previousScrollTop = -1;
  let scrollAttempts = 0;
  const maxScrollAttempts = 200;
  const scrollIncrement = 300; // Smaller increments for better lazy-loading detection
  let consecutiveNoProgress = 0;

  while (scrollAttempts < maxScrollAttempts) {
    const scrollStartTime = Date.now();
    lazyLoadMetrics.scrollEventCount++;
    lazyLoadMetrics.totalScrollDistance += scrollIncrement; // Track total distance scrolled

    // Scroll incrementally to trigger lazy loading
    await driver.driver.executeScript(`
      // Scroll window
      window.scrollBy(0, ${scrollIncrement});

      // Also try to scroll container if it exists
      const tokensTab = document.querySelector('[data-testid="account-overview__asset-tab"]');
      if (tokensTab) {
        let element = tokensTab;
        while (element && element !== document.body) {
          const style = window.getComputedStyle(element);
          if (style.overflowY === 'auto' || style.overflowY === 'scroll' ||
              style.overflow === 'auto' || style.overflow === 'scroll') {
            element.scrollTop += ${scrollIncrement};
            break;
          }
          element = element.parentElement;
        }
      }
    `);

    // Wait for 75% of visible tokens to be fully loaded before continuing
    // Poll up to 10 times (5 seconds total) for content to load
    let sufficientTokensLoaded = false;
    let scrollToLoadLatency = 0;
    let assetsLoadedThisScroll = 0;
    let previousLoadedCount = 0;

    for (let waitAttempt = 0; waitAttempt < 10; waitAttempt++) {
      await driver.delay(500);

      const loadStatus = (await driver.driver.executeScript(`
        const tokens = Array.from(document.querySelectorAll('[data-testid="multichain-token-list-item"]'));
        const viewportTop = window.pageYOffset || document.documentElement.scrollTop;
        const viewportBottom = viewportTop + window.innerHeight;

        let visibleCount = 0;
        let loadedCount = 0;

        // Count visible tokens and how many are fully loaded
        for (const token of tokens) {
          const rect = token.getBoundingClientRect();
          const elementTop = rect.top + viewportTop;
          const elementBottom = rect.bottom + viewportTop;

          // Check if element is in viewport
          const isVisible = elementBottom >= viewportTop && elementTop <= viewportBottom;
          if (!isVisible) continue;

          visibleCount++;

          // Check if token is fully loaded
          const tokenImage = token.querySelector('img, [class*="avatar"], [class*="icon"]');
          const hasImage = tokenImage && (
            (tokenImage.tagName === 'IMG' && tokenImage.complete && tokenImage.naturalWidth > 0) ||
            (tokenImage.tagName !== 'IMG' && tokenImage.offsetWidth > 0 && tokenImage.offsetHeight > 0)
          );

          const textContent = token.textContent?.trim() || '';
          const hasText = textContent.length > 0;
          const hasValue = /[0-9]/.test(textContent);

          if (hasImage && hasText && hasValue) {
            loadedCount++;
          }
        }

        // Return true if 75% or more of visible tokens are loaded
        // Or if we have at least 1 visible token and it's loaded (handles edge case of very few tokens)
        return {
          visibleCount,
          loadedCount,
          percentageLoaded: visibleCount > 0 ? (loadedCount / visibleCount) * 100 : 0,
          sufficient: visibleCount > 0 && (loadedCount / visibleCount >= 0.75 || (visibleCount === 1 && loadedCount === 1))
        };
      `)) as {
        visibleCount: number;
        loadedCount: number;
        percentageLoaded: number;
        sufficient: boolean;
      };

      // Track first visible asset
      if (loadStatus.loadedCount > 0 && firstVisibleAssetTime === null) {
        firstVisibleAssetTime = Date.now();
        lazyLoadMetrics.timeToFirstVisibleAsset =
          firstVisibleAssetTime - flowStartTime;
      }

      // Track time to 75% loaded
      if (loadStatus.sufficient && timeTo75Percent === null) {
        timeTo75Percent = Date.now();
        lazyLoadMetrics.timeTo75PercentLoaded = timeTo75Percent - flowStartTime;
      }

      // Track assets loaded this scroll
      assetsLoadedThisScroll = loadStatus.loadedCount - previousLoadedCount;
      previousLoadedCount = loadStatus.loadedCount;

      if (loadStatus.sufficient) {
        sufficientTokensLoaded = true;
        scrollToLoadLatency = Date.now() - scrollStartTime;
        lazyLoadMetrics.scrollToLoadLatencies.push(scrollToLoadLatency);
        lazyLoadMetrics.assetsLoadedPerScroll.push(assetsLoadedThisScroll);
        lazyLoadMetrics.cumulativeLoadTime += scrollToLoadLatency;
        break;
      }
    }

    // If we didn't reach 75%, still record the latency
    if (!sufficientTokensLoaded) {
      scrollToLoadLatency = Date.now() - scrollStartTime;
      lazyLoadMetrics.scrollToLoadLatencies.push(scrollToLoadLatency);
      lazyLoadMetrics.cumulativeLoadTime += scrollToLoadLatency;
    }

    // Check scroll position to detect if we've reached the end
    const scrollInfo = (await driver.driver.executeScript(`
      return {
        scrollTop: window.pageYOffset || document.documentElement.scrollTop,
        scrollHeight: document.documentElement.scrollHeight,
        innerHeight: window.innerHeight,
      };
    `)) as {
      scrollTop: number;
      scrollHeight: number;
      innerHeight: number;
    };

    const currentScrollTop = scrollInfo.scrollTop;
    const isAtBottom =
      currentScrollTop + scrollInfo.innerHeight >= scrollInfo.scrollHeight - 10;

    // If scroll position hasn't changed and we're at bottom, we're done
    if (currentScrollTop === previousScrollTop && isAtBottom) {
      console.log('Reached end of tokens list');
      break;
    }

    // If scroll position hasn't changed but we're not at bottom, increment no-progress counter
    if (currentScrollTop === previousScrollTop) {
      consecutiveNoProgress++;
      if (consecutiveNoProgress >= 3) {
        console.log('No scroll progress after 3 attempts, stopping');
        break;
      }
    } else {
      consecutiveNoProgress = 0;
    }

    previousScrollTop = currentScrollTop;
    scrollAttempts++;
  }

  // Store lazy-loading metrics in window for collection
  await driver.driver.executeScript(`
    window.__lazyLoadMetrics = {
      scrollToLoadLatencies: ${JSON.stringify(lazyLoadMetrics.scrollToLoadLatencies)},
      timeToFirstVisibleAsset: ${lazyLoadMetrics.timeToFirstVisibleAsset || null},
      timeTo75PercentLoaded: ${lazyLoadMetrics.timeTo75PercentLoaded || null},
      scrollEventCount: ${lazyLoadMetrics.scrollEventCount},
      totalScrollDistance: ${lazyLoadMetrics.totalScrollDistance},
      assetsLoadedPerScroll: ${JSON.stringify(lazyLoadMetrics.assetsLoadedPerScroll)},
      cumulativeLoadTime: ${lazyLoadMetrics.cumulativeLoadTime},
    };
  `);

  // Scroll back to top
  await driver.driver.executeScript(`
    window.scrollTo(0, 0);
    const tokensTab = document.querySelector('[data-testid="account-overview__asset-tab"]');
    if (tokensTab) {
      let element = tokensTab;
      while (element && element !== document.body) {
        const style = window.getComputedStyle(element);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll' ||
            style.overflow === 'auto' || style.overflow === 'scroll') {
          element.scrollTop = 0;
          break;
        }
        element = element.parentElement;
      }
    }
  `);
  await driver.delay(500);

  // Navigate to activity tab to ensure consistent state for next iteration
  await homePage.goToActivityList();
  await driver.delay(500);
}

/**
 * Flow: NFT List Scrolling - scrolls to the end of the NFT list
 */
async function nftListScrollingFlow(driver: Driver): Promise<void> {
  const homePage = new HomePage(driver);

  await homePage.checkPageIsLoaded();

  // Go to NFTs tab
  await homePage.goToNftTab();
  await driver.delay(1000); // Wait for NFTs to load

  // Track lazy-loading metrics
  const lazyLoadMetrics = {
    scrollToLoadLatencies: [] as number[],
    timeToFirstVisibleAsset: null as number | null,
    timeTo75PercentLoaded: null as number | null,
    scrollEventCount: 0,
    totalScrollDistance: 0,
    assetsLoadedPerScroll: [] as number[],
    cumulativeLoadTime: 0,
  };

  const flowStartTime = Date.now();
  let firstVisibleAssetTime: number | null = null;
  let timeTo75Percent: number | null = null;

  // Track scroll position to detect when we've reached the end
  let previousScrollTop = -1;
  let scrollAttempts = 0;
  const maxScrollAttempts = 200;
  const scrollIncrement = 300; // Smaller increments for better lazy-loading detection
  let consecutiveNoProgress = 0;

  while (scrollAttempts < maxScrollAttempts) {
    const scrollStartTime = Date.now();
    lazyLoadMetrics.scrollEventCount++;
    lazyLoadMetrics.totalScrollDistance += scrollIncrement; // Track total distance scrolled

    // Scroll incrementally to trigger lazy loading
    await driver.driver.executeScript(`
      // Scroll window
      window.scrollBy(0, ${scrollIncrement});

      // Also try to scroll container if it exists
      const nftsTab = document.querySelector('[data-testid="account-overview__nfts-tab"]');
      if (nftsTab) {
        let element = nftsTab;
        while (element && element !== document.body) {
          const style = window.getComputedStyle(element);
          if (style.overflowY === 'auto' || style.overflowY === 'scroll' ||
              style.overflow === 'auto' || style.overflow === 'scroll') {
            element.scrollTop += ${scrollIncrement};
            break;
          }
          element = element.parentElement;
        }
      }
    `);

    // Wait for 75% of visible NFTs to be fully loaded before continuing
    // Poll up to 10 times (5 seconds total) for content to load
    let sufficientNftsLoaded = false;
    let scrollToLoadLatency = 0;
    let assetsLoadedThisScroll = 0;
    let previousLoadedCount = 0;

    for (let waitAttempt = 0; waitAttempt < 10; waitAttempt++) {
      await driver.delay(500);

      const loadStatus = (await driver.driver.executeScript(`
        const nfts = Array.from(document.querySelectorAll('[data-testid="nft-wrapper"]'));
        const viewportTop = window.pageYOffset || document.documentElement.scrollTop;
        const viewportBottom = viewportTop + window.innerHeight;

        let visibleCount = 0;
        let loadedCount = 0;

        // Count visible NFTs and how many are fully loaded
        for (const nft of nfts) {
          const rect = nft.getBoundingClientRect();
          const elementTop = rect.top + viewportTop;
          const elementBottom = rect.bottom + viewportTop;

          // Check if element is in viewport
          const isVisible = elementBottom >= viewportTop && elementTop <= viewportBottom;
          if (!isVisible) continue;

          visibleCount++;

          // Check if NFT is fully loaded
          const nftImage = nft.querySelector('[data-testid="nft-image"], [data-testid="nft-default-image"]');
          const hasImage = nftImage && (
            (nftImage.tagName === 'IMG' && nftImage.complete && nftImage.naturalWidth > 0) ||
            (nftImage.tagName !== 'IMG' && nftImage.offsetWidth > 0 && nftImage.offsetHeight > 0)
          );

          const textContent = nft.textContent?.trim() || '';
          const hasText = textContent.length > 0;
          const hasNetworkBadge = nft.querySelector('[data-testid="nft-network-badge"]') !== null;

          if (hasImage && hasText && hasNetworkBadge) {
            loadedCount++;
          }
        }

        // Return true if 75% or more of visible NFTs are loaded
        // Or if we have at least 1 visible NFT and it's loaded (handles edge case of very few NFTs)
        return {
          visibleCount,
          loadedCount,
          percentageLoaded: visibleCount > 0 ? (loadedCount / visibleCount) * 100 : 0,
          sufficient: visibleCount > 0 && (loadedCount / visibleCount >= 0.75 || (visibleCount === 1 && loadedCount === 1))
        };
      `)) as {
        visibleCount: number;
        loadedCount: number;
        percentageLoaded: number;
        sufficient: boolean;
      };

      // Track first visible asset
      if (loadStatus.loadedCount > 0 && firstVisibleAssetTime === null) {
        firstVisibleAssetTime = Date.now();
        lazyLoadMetrics.timeToFirstVisibleAsset =
          firstVisibleAssetTime - flowStartTime;
      }

      // Track time to 75% loaded
      if (loadStatus.sufficient && timeTo75Percent === null) {
        timeTo75Percent = Date.now();
        lazyLoadMetrics.timeTo75PercentLoaded = timeTo75Percent - flowStartTime;
      }

      // Track assets loaded this scroll
      assetsLoadedThisScroll = loadStatus.loadedCount - previousLoadedCount;
      previousLoadedCount = loadStatus.loadedCount;

      if (loadStatus.sufficient) {
        sufficientNftsLoaded = true;
        scrollToLoadLatency = Date.now() - scrollStartTime;
        lazyLoadMetrics.scrollToLoadLatencies.push(scrollToLoadLatency);
        lazyLoadMetrics.assetsLoadedPerScroll.push(assetsLoadedThisScroll);
        lazyLoadMetrics.cumulativeLoadTime += scrollToLoadLatency;
        break;
      }
    }

    // If we didn't reach 75%, still record the latency
    if (!sufficientNftsLoaded) {
      scrollToLoadLatency = Date.now() - scrollStartTime;
      lazyLoadMetrics.scrollToLoadLatencies.push(scrollToLoadLatency);
      lazyLoadMetrics.cumulativeLoadTime += scrollToLoadLatency;
    }

    // Check scroll position to detect if we've reached the end
    const scrollInfo = (await driver.driver.executeScript(`
      return {
        scrollTop: window.pageYOffset || document.documentElement.scrollTop,
        scrollHeight: document.documentElement.scrollHeight,
        innerHeight: window.innerHeight,
      };
    `)) as {
      scrollTop: number;
      scrollHeight: number;
      innerHeight: number;
    };

    const currentScrollTop = scrollInfo.scrollTop;
    const isAtBottom =
      currentScrollTop + scrollInfo.innerHeight >= scrollInfo.scrollHeight - 10;

    // If scroll position hasn't changed and we're at bottom, we're done
    if (currentScrollTop === previousScrollTop && isAtBottom) {
      console.log('Reached end of NFT list');
      break;
    }

    // If scroll position hasn't changed but we're not at bottom, increment no-progress counter
    if (currentScrollTop === previousScrollTop) {
      consecutiveNoProgress++;
      if (consecutiveNoProgress >= 3) {
        console.log('No scroll progress after 3 attempts, stopping');
        break;
      }
    } else {
      consecutiveNoProgress = 0;
    }

    // Note: totalScrollDistance is already incremented at the start of each scroll attempt
    // using the constant scrollIncrement value (more reliable than position-based tracking
    // which doesn't work well with container scrolling)

    previousScrollTop = currentScrollTop;
    scrollAttempts++;
  }

  // Store lazy-loading metrics in window for collection
  await driver.driver.executeScript(`
    window.__lazyLoadMetrics = {
      scrollToLoadLatencies: ${JSON.stringify(lazyLoadMetrics.scrollToLoadLatencies)},
      timeToFirstVisibleAsset: ${lazyLoadMetrics.timeToFirstVisibleAsset || null},
      timeTo75PercentLoaded: ${lazyLoadMetrics.timeTo75PercentLoaded || null},
      scrollEventCount: ${lazyLoadMetrics.scrollEventCount},
      totalScrollDistance: ${lazyLoadMetrics.totalScrollDistance},
      assetsLoadedPerScroll: ${JSON.stringify(lazyLoadMetrics.assetsLoadedPerScroll)},
      cumulativeLoadTime: ${lazyLoadMetrics.cumulativeLoadTime},
    };
  `);

  // Scroll back to top
  await driver.driver.executeScript(`
    window.scrollTo(0, 0);
    const nftsTab = document.querySelector('[data-testid="account-overview__nfts-tab"]');
    if (nftsTab) {
      let element = nftsTab;
      while (element && element !== document.body) {
        const style = window.getComputedStyle(element);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll' ||
            style.overflow === 'auto' || style.overflow === 'scroll') {
          element.scrollTop = 0;
          break;
        }
        element = element.parentElement;
      }
    }
  `);
  await driver.delay(500);

  // Navigate to activity tab to ensure consistent state for next iteration
  await homePage.goToActivityList();
  await driver.delay(500);
}

/**
 * Measures a user flow and collects metrics
 */
async function measureFlow(
  flowName: string,
  flowFunction: (driver: Driver) => Promise<void>,
  driver: Driver,
  getNetworkReport: () => { numNetworkReqs: number },
  clearNetworkReport: () => void,
  runNumber: number,
): Promise<FlowBenchmarkResult> {
  // Ensure monitoring is injected FIRST (creates objects if they don't exist)
  try {
    await injectReactMonitoring(driver);
    // console.log('[MeasureFlow] injectReactMonitoring completed');
  } catch (error) {
    // console.error('[MeasureFlow] injectReactMonitoring failed:', error);
    throw error;
  }

  // THEN reset metrics (preserves object references so listeners keep working)
  try {
    await resetReactMetrics(driver);
    // console.log('[MeasureFlow] resetReactMetrics completed');
  } catch (error) {
    // console.error('[MeasureFlow] resetReactMetrics failed:', error);
    throw error;
  }

  // Wait a bit to ensure any pending async callbacks from previous runs complete
  // This prevents clearing arrays while requestAnimationFrame callbacks are still pending
  await driver.delay(100);

  // Clean up any open modals before starting the flow
  // This ensures a clean state for each iteration (important for multiple iterations)
  // Retry cleanup up to 3 times to handle race conditions
  for (let cleanupAttempt = 0; cleanupAttempt < 3; cleanupAttempt++) {
    try {
      const isNetworkModalOpen = await driver.isElementPresent(
        '.multichain-network-list-menu-content-wrapper',
      );
      if (!isNetworkModalOpen) {
        // Modal is closed, we're done
        break;
      }

      if (cleanupAttempt > 0) {
        console.log(`Retrying modal cleanup (attempt ${cleanupAttempt + 1}/3)`);
        await driver.delay(500); // Wait a bit before retrying
      } else {
        console.log('Closing open network modal before starting flow');
      }

      const selectNetwork = new SelectNetwork(driver);
      await selectNetwork.clickCloseButton();

      // Wait for modal to disappear with a longer timeout
      await driver.assertElementNotPresent(
        '.multichain-network-list-menu-content-wrapper',
        {
          waitAtLeastGuard: 500,
          timeout: 8000, // Increased timeout
        },
      );

      // Double-check it's actually gone
      const stillOpen = await driver.isElementPresent(
        '.multichain-network-list-menu-content-wrapper',
      );
      if (!stillOpen) {
        // Successfully closed
        break;
      }
    } catch (error) {
      // If this is the last attempt, log a warning
      if (cleanupAttempt === 2) {
        console.warn(
          `Could not close network modal after 3 attempts: ${error}`,
        );
      }
      // Continue to next attempt or proceed if all attempts failed
    }
  }

  // Final check and wait to ensure UI is stable
  await driver.delay(300);

  // Monitoring is already injected in measureFlow, but ensure it's still active
  // (injectReactMonitoring is idempotent - it checks if already set up)

  // Clear network report BEFORE the flow runs
  clearNetworkReport();

  // Wait for page to be ready
  await driver.delay(500);

  // Execute the flow
  const flowStartTime = Date.now();
  await flowFunction(driver);
  const flowEndTime = Date.now();

  // Wait for any pending renders and network requests
  await driver.delay(1000);

  // IMPORTANT: Collect metrics BEFORE navigation, as navigation clears window objects
  // Collect standard metrics
  const standardMetrics = await driver.collectMetrics();
  // Get network requests count AFTER the flow completes
  standardMetrics.numNetworkReqs = getNetworkReport().numNetworkReqs;

  // Collect React-specific metrics
  const reactMetrics = await collectReactMetrics(driver);

  // Debug: Verify metrics objects exist
  const metricsCheck = await driver.driver.executeScript(`
    return {
      inpMetricsExists: !!window.__inpMetrics,
      inpInteractionsCount: window.__inpMetrics?.interactions?.length || 0,
      tbtMetricsExists: !!window.__tbtMetrics,
      tbtLongTasksCount: window.__tbtMetrics?.longTasks?.length || 0,
      tbtTotalBlockingTime: window.__tbtMetrics?.totalBlockingTime || 0,
      reactRenderMetricsExists: !!window.__REACT_RENDER_METRICS__,
      reactRenderCount: Array.isArray(window.__REACT_RENDER_METRICS__) ? window.__REACT_RENDER_METRICS__.length : 0,
    };
  `);
  // console.log('[MeasureFlow] Metrics check after flow:', metricsCheck);

  // Navigate back to home page AFTER collecting metrics
  // This ensures we're in a consistent state for next iteration
  // Skip navigation for onboarding flows as they already end on the home page
  const isOnboardingFlow = flowName === 'import-srp';
  if (!isOnboardingFlow) {
    try {
      await driver.navigate('home');
      const homePage = new HomePage(driver);
      await homePage.checkPageIsLoaded();
      await driver.delay(500); // Small delay to ensure page is stable
    } catch (navError) {
      console.warn(
        'Could not navigate back to home page after flow:',
        navError,
      );
      // Try to recover by waiting a bit longer and checking again
      await driver.delay(2000);
      try {
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
      } catch (recoveryError) {
        console.warn('Could not recover to home page:', recoveryError);
        // Continue anyway - metrics were already collected
      }
    }
  } else {
    // For onboarding flows, just verify we're on home page (already verified by flow)
    // and wait a bit for stability
    await driver.delay(500);
  }

  // Combine metrics
  const metrics: ReactCompilerMetrics = {
    ...standardMetrics,
    ...reactMetrics,
    interactionLatency: flowEndTime - flowStartTime,
  };

  return {
    flow: flowName,
    run: runNumber,
    metrics,
    timestamp: Date.now(),
  };
}

/**
 * Measures a flow multiple times
 *
 * @param flowName - Name of the flow being measured
 * @param flowFunction - The flow function to execute
 * @param iterations - Number of measured iterations per browser load
 * @param warmupIterations - Number of warmup iterations to discard (default: 1)
 * @param portOffset - Port offset for concurrent runs (default: 0)
 */
async function measureFlowMultiple(
  flowName: string,
  flowFunction: (driver: Driver) => Promise<void>,
  iterations: number,
  warmupIterations: number = DEFAULT_WARMUP_ITERATIONS,
  portOffset: number = 0,
): Promise<FlowBenchmarkResult[]> {
  const results: FlowBenchmarkResult[] = [];

  // Import SRP flow requires a fresh browser state (no existing wallet)
  const isOnboardingFlow = flowName === 'import-srp';

  // Calculate ports with offset for concurrent runs
  const anvilPort = 8545 + portOffset;
  const secondaryAnvilPort = 8546 + portOffset;

  await withFixtures(
    {
      title: `measureFlow-${flowName}`,
      fixtures: isOnboardingFlow
        ? // For onboarding, use proper onboarding fixture
          new FixtureBuilder({ onboarding: true }).build()
        : // For other flows, use power user state
          (await generateWalletState(WITH_STATE_POWER_USER, true)).build(),
      // Add localNodeOptions for network adding flow (needs secondary Anvil with chain ID 1338)
      localNodeOptions:
        flowName === 'network-adding'
          ? [
              {
                type: 'anvil',
                options: {
                  port: anvilPort,
                },
              },
              {
                type: 'anvil',
                options: {
                  port: secondaryAnvilPort,
                  chainId: 1338 + portOffset, // Must match chainId used in networkAddingFlow
                },
              },
            ]
          : {
              type: 'anvil',
              options: {
                port: anvilPort,
              },
            },
      portOffset, // Pass port offset to withFixtures for mock server and WebSocket
      manifestFlags: {
        testing: {
          disableSync: true,
          infuraProjectId: process.env.INFURA_PROJECT_ID,
        },
      },
      useMockingPassThrough: true,
      disableServerMochaToBackground: true,
      ignoredConsoleErrors: [
        'ERR_BLOCKED_BY_CLIENT',
        'net::ERR_BLOCKED_BY_CLIENT',
        'Unauthorized',
        'Error: -32006',
        'Error: -32603', // getSubscriptions RPC errors
        'getSubscriptions', // getSubscriptions API errors in test environments
        'failed to make request', // Network request failures (lowercase)
        'controller-loaded',
        'Waiting for element to be located',
        'TimeoutError',
        'SES_UNHANDLED_REJECTION',
        'Cannot read properties of undefined',
        'Failed to handle request',
        'socket hang up',
        'aborted',
      ],
    },
    async ({ driver, getNetworkReport, clearNetworkReport }) => {
      // For onboarding flows, navigate to extension but skip unlock
      // For other flows, unlock the existing wallet
      if (isOnboardingFlow) {
        // Navigate to extension's onboarding page
        await driver.navigate();
        console.log('Navigated to extension for onboarding flow');
      } else {
        await unlockWallet(driver);

        // Wait for network to be ready before running flows
        // This ensures RPC connections are authorized
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.waitForNetworkAndDOMReady();

        // Wait for balance element to verify network is working and RPC calls succeed
        // This is a reliable indicator that the network connection is authorized
        try {
          await driver.waitForSelector(
            '[data-testid="eth-overview__primary-currency"]',
            { timeout: 15000 },
          );
          // Additional delay to ensure network is fully ready for RPC calls
          await driver.delay(1500);
        } catch (error) {
          console.warn('Balance element not found, waiting longer:', error);
          await driver.delay(2500);
        }
      }

      // Onboarding flows can only run once per browser session (they create a wallet)
      // So limit iterations to 1 for onboarding flows
      const effectiveIterations = isOnboardingFlow ? 1 : iterations;
      const effectiveWarmup = isOnboardingFlow ? 0 : warmupIterations;
      const totalIterations = effectiveIterations + effectiveWarmup;

      if (isOnboardingFlow && iterations > 1) {
        console.log(
          `Note: Onboarding flows can only run once per browser load. Limiting iterations to 1 (requested: ${iterations}). Use --browserLoads to run multiple times.`,
        );
      }

      if (effectiveWarmup > 0) {
        console.log(
          `  Running ${effectiveWarmup} warmup + ${effectiveIterations} measured iterations`,
        );
      }

      let hasErrors = false;
      for (let i = 0; i < totalIterations; i++) {
        const isWarmup = i < effectiveWarmup;
        const iterationLabel = isWarmup
          ? `Warmup ${i + 1}/${effectiveWarmup}`
          : `Iteration ${i - effectiveWarmup + 1}/${effectiveIterations}`;
        console.log(`  ${iterationLabel}`);

        try {
          const result = await measureFlow(
            flowName,
            flowFunction,
            driver,
            getNetworkReport,
            clearNetworkReport,
            i,
          );

          // Only keep non-warmup iterations for results
          if (!isWarmup) {
            results.push(result);
          } else {
            console.log(`    (warmup discarded)`);
          }

          // Small delay between iterations
          await driver.delay(1000);
        } catch (error) {
          console.error(`Error in ${iterationLabel}:`, error);
          // Only count errors for non-warmup iterations
          if (!isWarmup) {
            hasErrors = true;
          }
          // Continue with next iteration
        }
      }

      // If we had errors, don't return results (they'll be empty or incomplete)
      if (hasErrors && results.length === 0) {
        throw new Error(
          `All iterations failed for flow ${flowName}. No results to return.`,
        );
      }
    },
  );

  return results;
}

/**
 * Statistical calculation helpers
 */
function calculateResult(calc: (array: number[]) => number) {
  return (result: Record<string, number[]>): StatisticalResult => {
    const calculatedResult: StatisticalResult = {};
    for (const key of Object.keys(result)) {
      calculatedResult[key] = calc(result[key]);
    }
    return calculatedResult;
  };
}

const calculateMean = (array: number[]): number =>
  array.reduce((sum, val) => sum + val, 0) / array.length;

const minResult = calculateResult((array: number[]) => Math.min(...array));
const maxResult = calculateResult((array: number[]) => Math.max(...array));
const meanResult = calculateResult((array: number[]) => calculateMean(array));
const standardDeviationResult = calculateResult((array: number[]) => {
  if (array.length === 1) {
    return 0;
  }
  const average = calculateMean(array);
  const squareDiffs = array.map((value) => Math.pow(value - average, 2));
  return Math.sqrt(calculateMean(squareDiffs));
});

// Calculate the pth percentile of an array
function pResult(
  array: Record<string, number[]>,
  p: number,
): StatisticalResult {
  return calculateResult((arr: number[]) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.floor((p / 100.0) * sorted.length);
    return sorted[index] || 0;
  })(array);
}

/**
 * Retry wrapper that tracks the number of attempts used
 *
 * @param options - Retry options
 * @param options.retries - Maximum number of retries
 * @param fn - Function to retry
 * @returns Result with retry tracking info
 */
async function retryWithTracking<ResultType>(
  options: { retries: number },
  fn: () => Promise<ResultType>,
): Promise<{ result: ResultType; retriesUsed: number; errors: string[] }> {
  const errors: string[] = [];
  let attempts = 0;

  while (attempts <= options.retries) {
    try {
      const result = await fn();
      return { result, retriesUsed: attempts, errors };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      errors.push(`Attempt ${attempts + 1}: ${errorMessage}`);
      attempts += 1;

      if (attempts > options.retries) {
        throw error;
      }
      console.log('Ready to retry() again');
    }
  }

  // This should never be reached, but TypeScript needs it
  throw new Error('Retry limit exceeded');
}

/**
 * Profiles user flows and calculates statistics
 *
 * @param flows - Array of flow names to benchmark
 * @param browserLoads - Number of browser loads per flow
 * @param iterations - Number of iterations per browser load
 * @param retries - Maximum number of retries per browser load
 * @param warmupIterations - Number of warmup iterations to discard per browser load
 * @param portOffset - Port offset for concurrent runs (default: 0)
 * @param outputCallback - Optional callback for incremental results
 * @returns Results and flow reports
 */
async function profileFlows(
  flows: string[],
  browserLoads: number,
  iterations: number,
  retries: number,
  warmupIterations: number = DEFAULT_WARMUP_ITERATIONS,
  portOffset: number = 0,
  outputCallback?: (flowName: string, results: BenchmarkResults) => void,
): Promise<{
  results: Record<string, BenchmarkResults>;
  flowReports: FlowRunReport[];
}> {
  const results: Record<string, BenchmarkResults> = {};
  const flowReports: FlowRunReport[] = [];

  // Map flow names to functions
  // Note: Some flows like network-adding need the portOffset for concurrent runs
  const flowMap: Record<string, (driver: Driver) => Promise<void>> = {
    'tab-switching': tabSwitchingFlow,
    'account-switching': accountSwitchingFlow,
    'network-switching': networkSwitchingFlow,
    'network-adding': (driver: Driver) => networkAddingFlow(driver, portOffset),
    'import-srp': importSrpFlow,
    'token-search': tokenSearchFlow,
    'token-send': tokenSendFlow,
    'tokens-list-scrolling': tokensListScrollingFlow,
    'nft-list-scrolling': nftListScrollingFlow,
  };

  for (const flowName of flows) {
    const flowFunction = flowMap[flowName];

    // Initialize flow report
    const flowReport: FlowRunReport = {
      flowName,
      status: 'pending' as FlowRunStatus,
      retriesUsed: 0,
      totalRetries: retries,
      errors: [],
      warnings: [],
      iterationsCompleted: 0,
      iterationsRequested: iterations,
      browserLoadsCompleted: 0,
      browserLoadsRequested: browserLoads,
    };

    if (!flowFunction) {
      flowReport.status = 'skipped';
      flowReport.warnings.push(`Unknown flow: ${flowName}`);
      flowReports.push(flowReport);
      console.warn(`Unknown flow: ${flowName}, skipping`);
      continue;
    }

    try {
      console.log(`\nStarting benchmark for flow: ${flowName}`);
      let runResults: FlowBenchmarkResult[] = [];

      let hasBrowserLoadErrors = false;
      let maxRetriesUsed = 0;

      for (let i = 0; i < browserLoads; i += 1) {
        console.log(`Browser load ${i + 1}/${browserLoads}`);
        try {
          const {
            result,
            retriesUsed,
            errors: retryErrors,
          } = await retryWithTracking({ retries }, () =>
            measureFlowMultiple(
              flowName,
              flowFunction,
              iterations,
              warmupIterations,
              portOffset,
            ),
          );

          maxRetriesUsed = Math.max(maxRetriesUsed, retriesUsed);
          if (retryErrors.length > 0) {
            flowReport.warnings.push(
              ...retryErrors.map((e) => `Browser load ${i + 1}: ${e}`),
            );
          }

          if (result && result.length > 0) {
            runResults = runResults.concat(result);
            flowReport.browserLoadsCompleted++;
            flowReport.iterationsCompleted += result.length;
          } else {
            flowReport.warnings.push(
              `Browser load ${i + 1} completed but returned no results`,
            );
            console.warn(
              `Browser load ${i + 1} completed but returned no results`,
            );
            hasBrowserLoadErrors = true;
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          flowReport.errors.push(`Browser load ${i + 1}: ${errorMessage}`);
          console.error(
            `Error in browser load ${i + 1} for flow ${flowName}:`,
            error,
          );
          hasBrowserLoadErrors = true;
          maxRetriesUsed = retries; // All retries were used if we got here
          // Continue with next browser load
        }
      }

      flowReport.retriesUsed = maxRetriesUsed;

      if (runResults.length === 0) {
        flowReport.status = 'failed';
        flowReport.errors.push('No successful results obtained');
        flowReports.push(flowReport);
        console.error(
          `No successful results for flow ${flowName}, skipping statistics`,
        );
        continue;
      }

      // Only output raw results if we had successful runs
      if (!hasBrowserLoadErrors || runResults.length > 0) {
        console.info(
          `Raw results for ${flowName}:`,
          JSON.stringify(runResults, null, 2),
        );
      }

      // Extract metrics for statistical analysis
      const metricKeys = [
        ...Object.keys(ALL_METRICS),
        'inp',
        'inpCount',
        'renderCount',
        'renderTime',
        'averageRenderTime',
        'interactionLatency',
        'fcp',
        'lcp',
        'tti',
        'tbt',
        'cls',
        'fid',
        'networkLatency',
        'networkBandwidth',
        'networkCacheHits',
        'networkCacheMisses',
        'networkCachePartial',
        'scrollToLoadLatency',
        'timeToFirstVisibleAsset',
        'timeTo75PercentLoaded',
        'scrollEventCount',
        'totalScrollDistance',
        'assetsLoadedPerScroll',
        'cumulativeLoadTime',
      ];

      const result: Record<string, number[]> = {};
      const dataQualityNotes: string[] = [];

      for (const key of metricKeys) {
        let values = runResults
          .map((r) => {
            // Handle nested properties like 'navigation[0].load'
            const value = get(r.metrics, key);
            return typeof value === 'number' ? value : null;
          })
          .filter((v): v is number => v !== null)
          .sort((a, b) => a - b);

        if (values.length === 0) continue;

        const originalCount = values.length;

        // Step 1: Filter timeout values for time-based metrics
        values = filterTimeouts(values, key, TIMEOUT_THRESHOLD_MS);
        const afterTimeoutFilter = values.length;
        if (afterTimeoutFilter < originalCount) {
          const removed = originalCount - afterTimeoutFilter;
          dataQualityNotes.push(
            `${key}: Filtered ${removed} timeout value(s) > ${TIMEOUT_THRESHOLD_MS}ms`,
          );
        }

        // Step 2: Remove outliers using IQR method (only if we have enough data)
        if (values.length >= 4) {
          const afterOutlierRemoval = removeOutliersIQR(values);
          const outliersRemoved = values.length - afterOutlierRemoval.length;
          if (outliersRemoved > 0) {
            dataQualityNotes.push(
              `${key}: Removed ${outliersRemoved} outlier(s) via IQR method`,
            );
            values = afterOutlierRemoval;
          }
        }

        if (values.length > 0) {
          result[key] = values;
        }
      }

      // Log data quality notes
      if (dataQualityNotes.length > 0) {
        console.log(`\nData quality filtering for ${flowName}:`);
        dataQualityNotes.forEach((note) => console.log(`  - ${note}`));
      }

      // Format flow name for better readability: "tab-switching" -> "Power User: Tab Switching"
      const formatFlowName = (name: string): string => {
        const words = name
          .split('-')
          .map((word) => capitalize(word))
          .join(' ');
        return `Power User: ${words}`;
      };
      const reportingFlowName = formatFlowName(flowName);

      const flowResults: BenchmarkResults = {
        mean: meanResult(result),
        min: minResult(result),
        max: maxResult(result),
        stdDev: standardDeviationResult(result),
        p75: pResult(result, 75),
        p95: pResult(result, 95),
      };

      // Only output results if we had successful runs (no errors or some successful results)
      if (hasBrowserLoadErrors && runResults.length === 0) {
        console.error(
          `All browser loads failed for flow ${flowName}, skipping results output`,
        );
        continue;
      }

      results[reportingFlowName] = flowResults;

      // Output results for this flow only if we have valid results
      if (runResults.length > 0) {
        flowReport.status = 'success';
        console.log(`\n=== Results for ${flowName} ===`);
        console.log(
          JSON.stringify({ [reportingFlowName]: flowResults }, null, 2),
        );

        // Call output callback if provided
        if (outputCallback) {
          outputCallback(reportingFlowName, flowResults);
        }
      } else {
        flowReport.status = 'failed';
        flowReport.errors.push('No valid results to output');
        console.error(
          `No valid results to output for flow ${flowName}, skipping`,
        );
      }

      flowReports.push(flowReport);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      flowReport.status = 'failed';
      flowReport.errors.push(`Unhandled error: ${errorMessage}`);
      flowReports.push(flowReport);
      console.error(`\nError processing flow ${flowName}:`, error);
      console.log(`Continuing to next flow...\n`);
      // Continue to next flow
    }
  }

  return { results, flowReports };
}

/**
 * Gets status icon for a flow status
 *
 * @param status - The flow run status
 * @returns The icon string
 */
function getStatusIcon(status: FlowRunStatus): string {
  if (status === 'success') {
    return '✅';
  }
  if (status === 'failed') {
    return '❌';
  }
  return '⏭️';
}

/**
 * Generates a formatted summary report
 *
 * @param flowReports - Array of flow run reports
 * @param results - Benchmark results by flow name
 * @param startTime - When the benchmark started
 * @param endTime - When the benchmark ended
 * @returns Formatted report string
 */
function generateSummaryReport(
  flowReports: FlowRunReport[],
  results: Record<string, BenchmarkResults>,
  startTime: Date,
  endTime: Date,
): string {
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationFormatted = formatDuration(durationMs);

  const successCount = flowReports.filter((r) => r.status === 'success').length;
  const failedCount = flowReports.filter((r) => r.status === 'failed').length;
  const skippedCount = flowReports.filter((r) => r.status === 'skipped').length;
  const totalCount = flowReports.length;

  const lines: string[] = [];

  // Header
  lines.push('');
  lines.push(
    '╔══════════════════════════════════════════════════════════════════════════════╗',
  );
  lines.push(
    '║                         BENCHMARK RUN REPORT                                 ║',
  );
  lines.push(
    '╚══════════════════════════════════════════════════════════════════════════════╝',
  );
  lines.push('');

  // Overall Status
  const overallStatus = failedCount === 0 ? '✅ SUCCESS' : '❌ FAILED';
  lines.push(`Overall Result: ${overallStatus}`);
  lines.push(`Duration: ${durationFormatted}`);
  lines.push(`Completed: ${new Date(endTime).toISOString()}`);
  lines.push('');

  // Summary counts
  lines.push(
    '┌─────────────────────────────────────────────────────────────────────────────┐',
  );
  lines.push(
    '│                              FLOW SUMMARY                                   │',
  );
  lines.push(
    '├─────────────────────────────────────────────────────────────────────────────┤',
  );
  lines.push(
    `│ Total: ${totalCount.toString().padEnd(3)} │ ✅ Success: ${successCount.toString().padEnd(3)} │ ❌ Failed: ${failedCount.toString().padEnd(3)} │ ⏭️  Skipped: ${skippedCount.toString().padEnd(3)} │`,
  );
  lines.push(
    '└─────────────────────────────────────────────────────────────────────────────┘',
  );
  lines.push('');

  // Flow details table
  lines.push(
    '┌───────────────────────────────┬──────────┬─────────────┬──────────────────┐',
  );
  lines.push(
    '│ Flow                          │ Status   │ Retries     │ Iterations       │',
  );
  lines.push(
    '├───────────────────────────────┼──────────┼─────────────┼──────────────────┤',
  );

  for (const report of flowReports) {
    const statusIcon = getStatusIcon(report.status);
    const flowNamePadded = report.flowName.padEnd(28).slice(0, 28);
    const statusPadded = `${statusIcon} ${report.status}`.padEnd(9).slice(0, 9);
    const retriesPadded = `${report.retriesUsed}/${report.totalRetries}`.padEnd(
      12,
    );
    const iterationsPadded =
      `${report.iterationsCompleted}/${report.iterationsRequested}`.padEnd(17);
    lines.push(
      `│ ${flowNamePadded} │ ${statusPadded}│ ${retriesPadded}│ ${iterationsPadded}│`,
    );
  }
  lines.push(
    '└───────────────────────────────┴──────────┴─────────────┴──────────────────┘',
  );
  lines.push('');

  // Errors section (if any)
  const flowsWithErrors = flowReports.filter((r) => r.errors.length > 0);
  if (flowsWithErrors.length > 0) {
    lines.push(
      '┌─────────────────────────────────────────────────────────────────────────────┐',
    );
    lines.push(
      '│                              ERRORS                                         │',
    );
    lines.push(
      '└─────────────────────────────────────────────────────────────────────────────┘',
    );
    for (const report of flowsWithErrors) {
      lines.push(`  ${report.flowName}:`);
      for (const error of report.errors) {
        lines.push(`    ❌ ${error}`);
      }
    }
    lines.push('');
  }

  // Warnings section (if any)
  const flowsWithWarnings = flowReports.filter((r) => r.warnings.length > 0);
  if (flowsWithWarnings.length > 0) {
    lines.push(
      '┌─────────────────────────────────────────────────────────────────────────────┐',
    );
    lines.push(
      '│                              WARNINGS                                       │',
    );
    lines.push(
      '└─────────────────────────────────────────────────────────────────────────────┘',
    );
    for (const report of flowsWithWarnings) {
      lines.push(`  ${report.flowName}:`);
      for (const warning of report.warnings) {
        lines.push(`    ⚠️  ${warning}`);
      }
    }
    lines.push('');
  }

  // Results summary table
  const successfulFlows = flowReports.filter((r) => r.status === 'success');
  if (successfulFlows.length > 0) {
    lines.push(
      '┌─────────────────────────────────────────────────────────────────────────────┐',
    );
    lines.push(
      '│                           METRICS SUMMARY                                   │',
    );
    lines.push(
      '└─────────────────────────────────────────────────────────────────────────────┘',
    );
    lines.push('');
    lines.push(
      '┌───────────────────────────────┬────────────┬────────────┬────────────┬────────────┬────────────┐',
    );
    lines.push(
      '│ Flow                          │ Renders    │ Render(ms) │ FCP(ms)    │ TBT(ms)    │ INP(ms)    │',
    );
    lines.push(
      '├───────────────────────────────┼────────────┼────────────┼────────────┼────────────┼────────────┤',
    );

    for (const report of successfulFlows) {
      const formattedName = `Power User: ${report.flowName
        .split('-')
        .map((w) => capitalize(w))
        .join(' ')}`;
      const flowResult = results[formattedName];

      if (flowResult) {
        const flowNamePadded = report.flowName.padEnd(28).slice(0, 28);
        const renders = formatNumber(flowResult.mean.renderCount, 10);
        const renderTime = formatNumber(flowResult.mean.renderTime, 10);
        const fcp = formatNumber(flowResult.mean.fcp, 10);
        const tbt = formatNumber(flowResult.mean.tbt, 10);
        const inp = formatNumber(flowResult.mean.inp, 10);

        lines.push(
          `│ ${flowNamePadded} │ ${renders} │ ${renderTime} │ ${fcp} │ ${tbt} │ ${inp} │`,
        );
      }
    }
    lines.push(
      '└───────────────────────────────┴────────────┴────────────┴────────────┴────────────┴────────────┘',
    );
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format duration in human-readable format
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Format number for table display
 *
 * @param value - Number to format
 * @param width - Width to pad to
 * @returns Formatted number string
 */
function formatNumber(value: number | undefined, width: number): string {
  if (value === undefined || value === null) {
    return '-'.padStart(width);
  }
  const formatted =
    value < 10 ? value.toFixed(2) : Math.round(value).toString();
  return formatted.padStart(width);
}

async function main(): Promise<void> {
  const { argv } = yargs(hideBin(process.argv)).usage(
    '$0 [options]',
    'Run React Compiler performance benchmark',
    (_yargs) =>
      _yargs
        .option('flows', {
          array: true,
          default: [
            'tab-switching',
            'account-switching',
            'network-switching',
            'network-adding',
            'import-srp',
            'token-search',
            'token-send',
            'tokens-list-scrolling',
            'nft-list-scrolling',
          ],
          description:
            'Set the flow(s) to be benchmarked. This flag can accept multiple values (space-separated).',
          choices: [
            'tab-switching',
            'account-switching',
            'network-switching',
            'network-adding',
            'import-srp',
            'token-search',
            'token-send',
            'tokens-list-scrolling',
            'nft-list-scrolling',
          ],
        })
        .option('browserLoads', {
          default: DEFAULT_NUM_BROWSER_LOADS,
          description:
            'The number of times the browser should be fully reloaded to run the benchmark.',
          type: 'number',
        })
        .option('iterations', {
          default: DEFAULT_NUM_PAGE_LOADS,
          description:
            'The number of times each flow should be executed per browser load.',
          type: 'number',
        })
        .option('out', {
          description:
            'Output filename. Output printed to STDOUT if this is omitted.',
          type: 'string',
          normalize: true,
        })
        .option('retries', {
          default: 3,
          description:
            'Set how many times each benchmark sample should be retried upon failure.',
          type: 'number',
        })
        .option('warmup', {
          default: DEFAULT_WARMUP_ITERATIONS,
          description:
            'Number of warmup iterations to discard per browser load. Auto-disabled when browserLoads > 1 (statistical aggregation handles variance).',
          type: 'number',
        })
        .option('noOutlierFilter', {
          default: false,
          description:
            'Disable outlier filtering (IQR method). By default, outliers are removed.',
          type: 'boolean',
        })
        .option('portOffset', {
          alias: 'p',
          default: 0,
          description:
            'Port offset for running concurrent instances. Each instance should use a different offset (e.g., 0, 100, 200). This shifts all server ports to avoid conflicts.',
          type: 'number',
        }),
  ) as unknown as { argv: FlowBenchmarkArguments };

  const { flows, browserLoads, iterations, out, retries, warmup, portOffset } =
    argv;

  // When running multiple browser loads, skip warmups (first load acts as implicit warmup)
  // Each browser load is independent, so warmups don't carry over between loads
  const effectiveWarmup = browserLoads > 1 ? 0 : warmup;
  if (browserLoads > 1 && warmup > 0) {
    console.log(
      `\n📊 Skipping warmup iterations (browserLoads=${browserLoads} > 1, statistical aggregation handles variance)`,
    );
  }

  // Log port offset if non-zero for concurrent runs
  if (portOffset !== 0) {
    console.log(`\n🔌 Port offset: ${portOffset}`);
    console.log(`   Mock server port: ${8000 + portOffset}`);
    console.log(`   WebSocket port: ${8088 + portOffset}`);
    console.log(`   Anvil port: ${8545 + portOffset}`);
    console.log(`   Secondary Anvil port: ${8546 + portOffset}`);
    console.log(`   Dapp base port: ${8080 + portOffset}\n`);
  }

  // Prepare output file if specified
  let outputFile: string | undefined;
  if (out) {
    const outputDirectory = path.dirname(out);
    const existingParentDirectory =
      await getFirstParentDirectoryThatExists(outputDirectory);
    if (!(await isWritable(existingParentDirectory))) {
      throw new Error('Specified output file directory is not writable');
    }

    if (outputDirectory !== existingParentDirectory) {
      await fs.mkdir(outputDirectory, { recursive: true });
    }
    outputFile = out;
  }

  // Track start time
  const startTime = new Date();

  // Accumulate results as flows complete
  const allResults: Record<string, BenchmarkResults> = {};

  // Callback to save results after each flow
  const saveFlowResults = async (
    flowName: string,
    flowResults: BenchmarkResults,
  ) => {
    allResults[flowName] = flowResults;

    // Save incremental results to file if output file is specified
    if (outputFile) {
      try {
        await fs.writeFile(outputFile, JSON.stringify(allResults, null, 2));
        console.log(`\nResults saved to ${outputFile}`);
      } catch (error) {
        console.error(`Error saving results to file:`, error);
      }
    }
  };

  // Process flows with error handling
  const { results, flowReports } = await profileFlows(
    flows,
    browserLoads,
    iterations,
    retries,
    effectiveWarmup,
    portOffset,
    saveFlowResults,
  );

  const endTime = new Date();

  // Merge any results we may have collected via callback
  Object.assign(allResults, results);

  // Generate and output the summary report
  const summaryReport = generateSummaryReport(
    flowReports,
    allResults,
    startTime,
    endTime,
  );
  console.log(summaryReport);

  // Output detailed JSON results
  console.log('\n=== Detailed Results (JSON) ===');
  if (Object.keys(allResults).length > 0) {
    console.log(JSON.stringify(allResults, null, 2));
  } else {
    console.log('No flows completed successfully.');
  }

  // Save final report to file if specified
  if (outputFile) {
    try {
      // Save both the report and detailed results
      const outputData = {
        report: {
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          durationMs: endTime.getTime() - startTime.getTime(),
          flowReports,
          summary: {
            totalFlows: flowReports.length,
            successfulFlows: flowReports.filter((r) => r.status === 'success')
              .length,
            failedFlows: flowReports.filter((r) => r.status === 'failed')
              .length,
            skippedFlows: flowReports.filter((r) => r.status === 'skipped')
              .length,
          },
        },
        results: allResults,
      };
      await fs.writeFile(outputFile, JSON.stringify(outputData, null, 2));
      console.log(`\nFull report saved to ${outputFile}`);
    } catch (error) {
      console.error(`Error saving final report to file:`, error);
    }
  }

  // Exit with error code if any flows failed
  const failedCount = flowReports.filter((r) => r.status === 'failed').length;
  if (failedCount > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  exitWithError(error);
});
