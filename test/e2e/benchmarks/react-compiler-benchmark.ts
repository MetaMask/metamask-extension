import { promises as fs } from 'fs';
import path from 'path';
import { capitalize } from 'lodash';
import get from 'lodash/get';
import { hideBin } from 'yargs/helpers';
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
import NetworkManager from '../page-objects/pages/network-manager';
import NetworkSwitchAlertModal from '../page-objects/pages/dialog/network-switch-alert-modal';
import AddEditNetworkModal from '../page-objects/pages/dialog/add-edit-network';
import AddNetworkRpcUrlModal from '../page-objects/pages/dialog/add-network-rpc-url';
import { Driver } from '../webdriver/driver';
import { completeImportSRPOnboardingFlow } from '../page-objects/flows/onboarding.flow';
import {
  BenchmarkResults,
  Metrics,
  StatisticalResult,
} from './types-generated';
import {
  ALL_METRICS,
  DEFAULT_NUM_BROWSER_LOADS,
  DEFAULT_NUM_PAGE_LOADS,
  WITH_STATE_POWER_USER,
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
    const interactionDurations = inpMetrics.interactions
      .map((i: any) => i.duration)
      .filter((d: number) => d > 0 && isFinite(d))
      .sort((a: number, b: number) => a - b);

    let inp = 0;
    if (interactionDurations.length > 0) {
      const inpIndex = Math.floor(interactionDurations.length * 0.75);
      inp = interactionDurations[inpIndex] || 0;
    }

    // Get FCP from Performance API
    const perfEntries = performance.getEntriesByType('paint');
    const fcpEntry = perfEntries.find(
      (entry) => entry.name === 'first-contentful-paint',
    );
    const fcp = fcpEntry ? fcpEntry.startTime : undefined;

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
 * Resets React metrics tracking
 */
async function resetReactMetrics(driver: Driver): Promise<void> {
  // console.log('[Reset] Starting resetReactMetrics');
  const result = await driver.driver.executeScript(`
    // Store original object references to verify they're preserved
    const originalInpMetrics = window.__inpMetrics;
    const originalTbtMetrics = window.__tbtMetrics;
    const originalReactRenderMetrics = window.__reactRenderMetrics;

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
    };
  `);

  // console.log('[Reset] Reset result:', result);
  // console.log('[Reset] INP interactions after reset:', result?.inpInteractionsCount);
  // console.log('[Reset] TBT longTasks after reset:', result?.tbtLongTasksCount);
}

/**
 * Flow: Tab Switching
 */
async function tabSwitchingFlow(driver: Driver): Promise<void> {
  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();

  // Track clicks manually to ensure INP is captured
  // Selenium clicks might not always trigger native events that are captured by our listeners
  const trackClick = async (clickAction: () => Promise<void>) => {
    // Get start time before click (in browser context)
    const clickStartTime = (await driver.driver.executeScript(`
      return performance.now();
    `)) as number;

    // Perform the actual Selenium click
    await clickAction();

    // Wait a bit for the click to process
    await driver.delay(50);

    // Wait for next paint and record INP (in browser context)
    await driver.driver.executeScript(`
      const startTime = ${clickStartTime};
      return new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const endTime = performance.now();
            if (window.__inpMetrics && window.__inpMetrics.interactions) {
              window.__inpMetrics.interactions.push({
                start: startTime,
                end: endTime,
                duration: endTime - startTime,
                type: 'click',
              });
              console.log('[INP] Manual tracking captured click: ' + (endTime - startTime).toFixed(2) + 'ms');
            } else {
              console.warn('[INP] Manual tracking failed - metrics object not available');
            }
            resolve(endTime - startTime);
          });
        });
      });
    `);
  };

  // Switch to Tokens tab and track interaction
  await trackClick(() => homePage.goToTokensTab());
  await driver.delay(500);

  // Switch to NFTs tab and track interaction
  await trackClick(() => homePage.goToNftTab());
  await driver.delay(500);

  // Switch to Activity tab and track interaction
  await trackClick(() => homePage.goToActivityList());
  await driver.delay(500);

  // Switch back to Tokens tab and track interaction
  await trackClick(() => homePage.goToTokensTab());
  await driver.delay(500);
}

/**
 * Flow: Account Switching
 */
async function accountSwitchingFlow(driver: Driver): Promise<void> {
  const headerNavbar = new HeaderNavbar(driver);
  const accountListPage = new AccountListPage(driver);

  // Open account menu
  await headerNavbar.openAccountMenu();

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

  // Switch to Account 2
  try {
    await accountListPage.switchToAccount('Account 2');
    await driver.delay(1000); // Wait for account switch to complete
  } catch (error) {
    console.warn('Could not switch to Account 2:', error);
  }

  // Open account menu again
  await headerNavbar.openAccountMenu();

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

  // Switch to Account 3
  try {
    await accountListPage.switchToAccount('Account 3');
    await driver.delay(1000);
  } catch (error) {
    console.warn('Could not switch to Account 3:', error);
  }

  // Switch back to Account 1
  await headerNavbar.openAccountMenu();

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

  try {
    await accountListPage.switchToAccount('Account 1');
    await driver.delay(1000);
  } catch (error) {
    console.warn('Could not switch to Account 1:', error);
  }
}

/**
 * Helper function to dismiss network connection error modals
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
        return true; // Error was present and dismissed
      } catch (dismissError) {
        // Try alternative dismiss methods
        try {
          await driver.clickElement('[data-testid="alert-modal-button"]');
          await driver.delay(500);
          return true;
        } catch (altError) {
          console.warn('Could not dismiss error modal:', altError);
          return true; // Error was present even if we couldn't dismiss it
        }
      }
    }

    // Also check for generic error messages in the UI
    const errorText = (await driver.driver.executeScript(`
      const errorElements = document.querySelectorAll('[role="alert"], .alert, [class*="error"], [class*="Error"]');
      for (const el of errorElements) {
        const text = el.textContent || '';
        if (text.toLowerCase().includes('unable to connect') ||
            text.toLowerCase().includes('check network connectivity')) {
          return text;
        }
      }
      return null;
    `)) as string | null;

    if (errorText) {
      console.warn(`Network connection error detected: ${errorText}`);
      return true; // Error is present
    }

    return false; // No error detected
  } catch (error) {
    // No error modal found, continue
    return false;
  }
}

/**
 * Flow: Network Switching
 */
async function networkSwitchingFlow(driver: Driver): Promise<void> {
  const headerNavbar = new HeaderNavbar(driver);
  const selectNetwork = new SelectNetwork(driver);
  const networkManager = new NetworkManager(driver);
  const homePage = new HomePage(driver);

  // Dismiss any network error modals that may have appeared (e.g., from failed RPC requests)
  // These modals can block the send button and cause checkPageIsLoaded() to time out
  await dismissNetworkErrorModal(driver);

  // Ensure home page is loaded and network is ready
  await homePage.checkPageIsLoaded();
  await homePage.waitForNetworkAndDOMReady();
  await driver.delay(500);

  // Ensure any open modals are closed before starting
  try {
    const isModalOpen = await driver.isElementPresent(
      '.multichain-network-list-menu-content-wrapper',
    );
    if (isModalOpen) {
      console.log('Closing existing network modal before starting flow');
      await selectNetwork.clickCloseButton();
      await driver.assertElementNotPresent(
        '.multichain-network-list-menu-content-wrapper',
        {
          waitAtLeastGuard: 500,
          timeout: 5000,
        },
      );
    }
  } catch (error) {
    // Modal might not be present, continue anyway
    console.warn('Could not check/close existing modal:', error);
  }

  // Wait a bit to ensure UI is stable
  await driver.delay(500);

  // Open network manager modal by clicking sort-by-networks
  // This opens the network manager modal (not the Select Network modal with search)
  await headerNavbar.checkPageIsLoaded();
  await driver.waitForSelector('[data-testid="sort-by-networks"]', {
    timeout: 15000,
    state: 'visible',
  });
  await driver.clickElement('[data-testid="sort-by-networks"]');
  await driver.delay(500);

  // Wait for the network manager modal to be loaded
  // The network manager modal has a close button and network list items
  await driver.waitForSelector('[data-testid="modal-header-close-button"]', {
    timeout: 15000,
  });
  await driver.delay(300);

  // Switch to Sei (if available)
  // In test environments, Sei may not be available, so we check first
  try {
    // Check if Sei network is available before trying to switch
    const seiNetworkExists = await driver.isElementPresent(
      '[data-testid="Sei"]',
    );
    if (seiNetworkExists) {
      // First check if Sei is already selected - if so, skip the switch
      const isAlreadySelected = (await driver.driver.executeScript(`
        const element = document.querySelector('[data-testid="Sei"]');
        if (!element) return false;
        const listItem = element.closest('.multichain-network-list-item');
        return listItem && listItem.classList.contains('multichain-network-list-item--selected');
      `)) as boolean;

      if (isAlreadySelected) {
        console.log('Sei is already selected, skipping switch');
        await selectNetwork.clickCloseButton();
        await driver.assertElementNotPresent(
          '.multichain-network-list-menu-content-wrapper',
          {
            waitAtLeastGuard: 500,
            timeout: 5000,
          },
        );
      } else {
        // Use the NetworkManager method to click the network
        // This uses clickElementAndWaitToDisappear which properly triggers React handlers
        // and waits for the modal to disappear automatically
        try {
          await networkManager.selectNetworkByNameWithWait('Sei');
        } catch (switchError) {
          console.warn('Failed to switch to Sei:', switchError);
          // Try to close modal if still open
          try {
            const isModalOpen = await driver.isElementPresent(
              '.multichain-network-list-menu-content-wrapper',
            );
            if (isModalOpen) {
              await selectNetwork.clickCloseButton();
              await driver.delay(500);
            }
          } catch (closeError) {
            // Ignore close errors
          }
          // Try to dismiss any error modals
          await dismissNetworkErrorModal(driver);
          console.warn('Skipping Sei switch due to error');
          return;
        }

        // Check for network connection error after switch and dismiss it
        // Connection errors are expected in test environments (public RPC endpoints may be blocked)
        // We still want to verify the UI switch completed successfully
        await driver.delay(500);
        const hasError = await dismissNetworkErrorModal(driver);
        if (hasError) {
          console.warn(
            'Network connection error detected (expected in test environment), but continuing to verify UI switch',
          );
        }

        // Wait until the network is actually selected (polling with retries)
        // Even if there's a connection error, the UI switch should still complete
        let isSeiSelected = false;
        const maxVerificationAttempts = 15; // Increased attempts
        const verificationDelay = 1000; // Increased delay to 1 second

        for (let attempt = 0; attempt < maxVerificationAttempts; attempt++) {
          try {
            // Check the network display in the header (more reliable than modal selection state)
            // This shows the actual active network, not just which networks are enabled
            const networkDisplayCheck = (await driver.driver.executeScript(`
            const networkDisplay = document.querySelector('[data-testid="network-display"]');
            if (!networkDisplay) return { found: false, networkName: null };

            // Try multiple methods to get the network name
            let networkName = '';

            // Method 1: Extract from aria-label (format: "Network menu Sei" or similar)
            const ariaLabel = networkDisplay.getAttribute('aria-label') || '';
            if (ariaLabel) {
              // Extract network name from aria-label (usually after "Network menu" or similar)
              const match = ariaLabel.match(/(?:network menu|network)\\s+(.+)$/i);
              if (match && match[1]) {
                networkName = match[1].trim();
              } else {
                // If no pattern match, try to get the last word/phrase
                const parts = ariaLabel.split(/\\s+/);
                if (parts.length > 1) {
                  networkName = parts.slice(-1)[0]; // Last word
                }
              }
            }

            // Method 2: Get from text content (direct text in the element)
            if (!networkName) {
              const textContent = networkDisplay.textContent?.trim();
              if (textContent && textContent.length > 0) {
                networkName = textContent;
              }
            }

            // Method 3: Look for label element inside
            if (!networkName) {
              const labelElement = networkDisplay.querySelector('[class*="label"], [class*="text"], .mm-text, span, div');
              if (labelElement) {
                networkName = labelElement.textContent?.trim() || '';
              }
            }

            // Method 4: Get from title attribute
            if (!networkName) {
              networkName = networkDisplay.getAttribute('title') || '';
            }

            // Method 2: Look for Text component inside (PickerNetwork renders label in a Text component)
            if (!networkName) {
              // The Text component might have various class names, try common patterns
              const textElement = networkDisplay.querySelector('span.mm-text, .mm-text, [class*="text"], span');
              if (textElement) {
                const text = textElement.textContent?.trim();
                if (text && text.length > 0 && !text.toLowerCase().includes('arrow')) {
                  // Filter out arrow icon text
                  networkName = text;
                }
              }
            }

            // Method 3: Get from text content (direct text in the element, but filter out icon text)
            if (!networkName) {
              const textContent = networkDisplay.textContent?.trim();
              if (textContent && textContent.length > 0) {
                // Filter out common icon/arrow text - get the first meaningful word
                const words = textContent.split(/\\s+/).filter(word =>
                  !word.toLowerCase().includes('arrow') &&
                  !word.toLowerCase().includes('menu') &&
                  word.length > 0
                );
                if (words.length > 0) {
                  // Take the first word (usually the network name)
                  networkName = words[0];
                }
              }
            }

            // Check if it contains "Sei" (case insensitive)
            const isSei = networkName.toLowerCase().includes('sei');

            return {
              found: true,
              networkName: networkName || null,
              isSei: isSei,
              ariaLabel: ariaLabel,
              textContent: networkDisplay.textContent?.trim() || null
            };
          `)) as {
              found: boolean;
              networkName: string | null;
              isSei: boolean;
              ariaLabel?: string;
              textContent?: string | null;
            };

            isSeiSelected = networkDisplayCheck.isSei;

            if (isSeiSelected) {
              console.log(
                `Verified: Sei is now active (attempt ${attempt + 1}). Network display: "${networkDisplayCheck.networkName}"`,
              );
              break;
            } else {
              console.log(
                `Waiting for Sei to become active (attempt ${attempt + 1}/${maxVerificationAttempts}). ` +
                  `Current network: "${networkDisplayCheck.networkName || 'unknown'}"` +
                  (networkDisplayCheck.ariaLabel
                    ? `, aria-label: "${networkDisplayCheck.ariaLabel}"`
                    : '') +
                  (networkDisplayCheck.textContent
                    ? `, textContent: "${networkDisplayCheck.textContent}"`
                    : ''),
              );
              await driver.delay(verificationDelay);
            }
          } catch (verifyError) {
            console.warn(
              `Verification attempt ${attempt + 1} failed:`,
              verifyError,
            );
            await driver.delay(verificationDelay);
          }
        }

        if (!isSeiSelected) {
          console.warn(
            `Sei network switch may not have completed after ${maxVerificationAttempts} attempts - network not marked as selected. ` +
              `This may be acceptable if Sei was already selected or if the switch is still in progress.`,
          );
        }
      }
    } else {
      console.warn('Sei network not available, skipping switch');
      // Close modal if it's open
      await selectNetwork.clickCloseButton();
      await driver.assertElementNotPresent(
        '.multichain-network-list-menu-content-wrapper',
        {
          waitAtLeastGuard: 500,
          timeout: 5000,
        },
      );
    }
  } catch (error) {
    console.warn('Could not switch to Sei:', error);
    // Try to close modal if it's still open after error
    try {
      const isModalOpen = await driver.isElementPresent(
        '.multichain-network-list-menu-content-wrapper',
      );
      if (isModalOpen) {
        await selectNetwork.clickCloseButton();
        // Wait for modal to disappear
        await driver.assertElementNotPresent(
          '.multichain-network-list-menu-content-wrapper',
          {
            waitAtLeastGuard: 500,
            timeout: 5000,
          },
        );
      }
    } catch (closeError) {
      console.warn('Could not close modal:', closeError);
      // Continue anyway - might be already closed
    }
  }

  // Wait a bit more to ensure UI is ready and no modals are blocking
  await driver.delay(500);

  // Open network picker again
  // Ensure no modal is blocking the click by checking first
  try {
    // Double-check modal is closed before opening
    const isModalOpen = await driver.isElementPresent(
      '.multichain-network-list-menu-content-wrapper',
    );
    if (isModalOpen) {
      console.warn('Modal still open, closing it before reopening');
      await selectNetwork.clickCloseButton();
      await driver.assertElementNotPresent(
        '.multichain-network-list-menu-content-wrapper',
        {
          waitAtLeastGuard: 500,
          timeout: 5000,
        },
      );
    }

    // Open network manager modal by clicking sort-by-networks
    await driver.waitForSelector('[data-testid="sort-by-networks"]', {
      timeout: 10000,
      state: 'visible',
    });
    await driver.clickElement('[data-testid="sort-by-networks"]');
    await driver.delay(500);
    // Wait for the network manager modal to open
    await driver.waitForSelector('[data-testid="modal-header-close-button"]', {
      timeout: 15000,
    });
    await driver.delay(300);
  } catch (error) {
    // If opening fails due to modal blocking, try closing it first
    console.warn(
      'Failed to open network picker, trying to close any open modals:',
      error,
    );
    try {
      const isModalOpen = await driver.isElementPresent(
        '.multichain-network-list-menu-content-wrapper',
      );
      if (isModalOpen) {
        await selectNetwork.clickCloseButton();
        await driver.assertElementNotPresent(
          '.multichain-network-list-menu-content-wrapper',
          {
            waitAtLeastGuard: 500,
            timeout: 5000,
          },
        );
      }
      await driver.delay(500);
      // Retry opening network manager modal
      await driver.waitForSelector('[data-testid="sort-by-networks"]', {
        timeout: 10000,
        state: 'visible',
      });
      await driver.clickElement('[data-testid="sort-by-networks"]');
      await driver.delay(500);
      await driver.waitForSelector(
        '[data-testid="modal-header-close-button"]',
        {
          timeout: 15000,
        },
      );
      await driver.delay(300);
    } catch (retryError) {
      console.warn('Could not open network menu after retry:', retryError);
      throw retryError;
    }
  }

  // Switch to zkSync Era
  try {
    // Check if zkSync Era network is available (try different variations of the name)
    const zksyncEraNetworkExists =
      (await driver.isElementPresent('[data-testid="zkSync Era"]')) ||
      (await driver.isElementPresent('[data-testid="zkSync Era Sepolia"]')) ||
      (await driver.isElementPresent('[data-testid="zkSync Era Mainnet"]'));

    let zksyncEraTestId = 'zkSync Era';
    if (await driver.isElementPresent('[data-testid="zkSync Era"]')) {
      zksyncEraTestId = 'zkSync Era';
    } else if (
      await driver.isElementPresent('[data-testid="zkSync Era Sepolia"]')
    ) {
      zksyncEraTestId = 'zkSync Era Sepolia';
    } else if (
      await driver.isElementPresent('[data-testid="zkSync Era Mainnet"]')
    ) {
      zksyncEraTestId = 'zkSync Era Mainnet';
    }

    if (!zksyncEraNetworkExists) {
      console.warn('zkSync Era network not available, skipping switch');
      // Close modal if it's open
      await selectNetwork.clickCloseButton();
      await driver.assertElementNotPresent(
        '.multichain-network-list-menu-content-wrapper',
        {
          waitAtLeastGuard: 500,
          timeout: 5000,
        },
      );
      return;
    }

    // Use the NetworkManager method to click the network
    // This uses clickElementAndWaitToDisappear which properly triggers React handlers
    // and waits for the modal to disappear automatically
    try {
      await networkManager.selectNetworkByNameWithWait(zksyncEraTestId);
    } catch (switchError) {
      console.warn(`Failed to switch to ${zksyncEraTestId}:`, switchError);
      // Try to dismiss any error modals
      await dismissNetworkErrorModal(driver);
      console.warn(`Skipping ${zksyncEraTestId} switch due to error`);
      return;
    }

    // Check for network connection error after switch and dismiss it
    // Connection errors are expected in test environments (public RPC endpoints may be blocked)
    // We still want to verify the UI switch completed successfully
    await driver.delay(500);
    const hasError = await dismissNetworkErrorModal(driver);
    if (hasError) {
      console.warn(
        `Network connection error detected (expected in test environment), but continuing to verify UI switch for ${zksyncEraTestId}`,
      );
    }

    // Wait until the network is actually selected (polling with retries)
    // Even if there's a connection error, the UI switch should still complete
    let isZksyncEraSelected = false;
    const maxVerificationAttempts = 10;
    const verificationDelay = 500;

    for (let attempt = 0; attempt < maxVerificationAttempts; attempt++) {
      try {
        // Check the network display in the header (more reliable than modal selection state)
        // This shows the actual active network, not just which networks are enabled
        const networkDisplayCheck = (await driver.driver.executeScript(`
            const networkDisplay = document.querySelector('[data-testid="network-display"]');
            if (!networkDisplay) return { found: false, networkName: null };

            // Try multiple methods to get the network name
            let networkName = '';

            // Method 1: Extract from aria-label (format: "Network menu zkSync Era" or similar)
            const ariaLabel = networkDisplay.getAttribute('aria-label') || '';
            if (ariaLabel) {
              // Extract network name from aria-label (usually after "Network menu" or similar)
              const match = ariaLabel.match(/(?:network menu|network)\\s+(.+)$/i);
              if (match && match[1]) {
                networkName = match[1].trim();
              } else {
                // If no pattern match, try to get the last word/phrase
                const parts = ariaLabel.split(/\\s+/);
                if (parts.length > 1) {
                  networkName = parts.slice(-1)[0]; // Last word
                }
              }
            }

            // Method 2: Get from text content (direct text in the element)
            if (!networkName) {
              const textContent = networkDisplay.textContent?.trim();
              if (textContent && textContent.length > 0) {
                networkName = textContent;
              }
            }

            // Method 3: Look for label element inside
            if (!networkName) {
              const labelElement = networkDisplay.querySelector('[class*="label"], [class*="text"], .mm-text, span, div');
              if (labelElement) {
                networkName = labelElement.textContent?.trim() || '';
              }
            }

            // Method 4: Get from title attribute
            if (!networkName) {
              networkName = networkDisplay.getAttribute('title') || '';
            }

            // Method 2: Look for Text component inside (PickerNetwork renders label in a Text component)
            if (!networkName) {
              // The Text component might have various class names, try common patterns
              const textElement = networkDisplay.querySelector('span.mm-text, .mm-text, [class*="text"], span');
              if (textElement) {
                const text = textElement.textContent?.trim();
                if (text && text.length > 0 && !text.toLowerCase().includes('arrow')) {
                  // Filter out arrow icon text
                  networkName = text;
                }
              }
            }

            // Method 3: Get from text content (direct text in the element, but filter out icon text)
            if (!networkName) {
              const textContent = networkDisplay.textContent?.trim();
              if (textContent && textContent.length > 0) {
                // Filter out common icon/arrow text - get the first meaningful word
                const words = textContent.split(/\\s+/).filter(word =>
                  !word.toLowerCase().includes('arrow') &&
                  !word.toLowerCase().includes('menu') &&
                  word.length > 0
                );
                if (words.length > 0) {
                  // Take the first word (usually the network name)
                  networkName = words[0];
                }
              }
            }

            // Check if it contains "zksync" or "era" (case insensitive)
            const isZksyncEra = networkName.toLowerCase().includes('zksync') ||
                                networkName.toLowerCase().includes('era');

            return {
              found: true,
              networkName: networkName || null,
              isZksyncEra: isZksyncEra,
              ariaLabel: ariaLabel,
              textContent: networkDisplay.textContent?.trim() || null
            };
          `)) as {
          found: boolean;
          networkName: string | null;
          isZksyncEra: boolean;
          ariaLabel?: string;
          textContent?: string | null;
        };

        isZksyncEraSelected = networkDisplayCheck.isZksyncEra;

        if (isZksyncEraSelected) {
          console.log(
            `Verified: ${zksyncEraTestId} is now active (attempt ${attempt + 1}). Network display: "${networkDisplayCheck.networkName}"`,
          );
          break;
        } else {
          console.log(
            `Waiting for ${zksyncEraTestId} to become active (attempt ${attempt + 1}/${maxVerificationAttempts}). ` +
              `Current network: "${networkDisplayCheck.networkName || 'unknown'}"` +
              (networkDisplayCheck.ariaLabel
                ? `, aria-label: "${networkDisplayCheck.ariaLabel}"`
                : '') +
              (networkDisplayCheck.textContent
                ? `, textContent: "${networkDisplayCheck.textContent}"`
                : ''),
          );
          await driver.delay(verificationDelay);
        }
      } catch (verifyError) {
        console.warn(
          `Verification attempt ${attempt + 1} failed:`,
          verifyError,
        );
        await driver.delay(verificationDelay);
      }
    }

    if (!isZksyncEraSelected) {
      console.warn(
        `${zksyncEraTestId} network switch may not have completed after ${maxVerificationAttempts} attempts - network not marked as selected`,
      );
    }
  } catch (error) {
    console.warn('Could not switch to zkSync Era:', error);
    // Try to close modal if it's still open after error
    try {
      const isModalOpen = await driver.isElementPresent(
        '.multichain-network-list-menu-content-wrapper',
      );
      if (isModalOpen) {
        await selectNetwork.clickCloseButton();
        await driver.delay(500);
      }
    } catch (closeError) {
      console.warn('Could not close modal after error:', closeError);
    }
  }
}

/**
 * Flow: Network Adding
 * Uses the same network details as the onboarding test: 'User can add custom network during onboarding'
 * Network: Localhost 8546, Chain ID: 1338, RPC URL: http://127.0.0.1:8546
 */
async function networkAddingFlow(driver: Driver): Promise<void> {
  const selectNetwork = new SelectNetwork(driver);
  const headerNavbar = new HeaderNavbar(driver);
  const homePage = new HomePage(driver);

  // Network details matching the onboarding test
  const networkName = 'Localhost 8546';
  const networkUrl = 'http://127.0.0.1:8546';
  const currencySymbol = 'ETH';
  const chainId = '1338'; // Chain ID 1338 (0x53a in hex)

  // Open network picker
  await headerNavbar.checkPageIsLoaded();
  await headerNavbar.openGlobalNetworksMenu();
  await selectNetwork.checkPageIsLoaded();
  await driver.delay(300);

  // Open add custom network modal
  try {
    await selectNetwork.openAddCustomNetworkModal();
    await driver.delay(500);

    // Fill in network details
    const addEditNetworkModal = new AddEditNetworkModal(driver);
    await addEditNetworkModal.checkPageIsLoaded();

    // Add RPC URL first - this will allow MetaMask to query the chain ID
    await addEditNetworkModal.openAddRpcUrlModal();
    const addRpcUrlModal = new AddNetworkRpcUrlModal(driver);
    await addRpcUrlModal.checkPageIsLoaded();

    // Fill RPC URL and name (matching onboarding test)
    await addRpcUrlModal.fillAddRpcUrlInput(networkUrl);
    await addRpcUrlModal.fillAddRpcNameInput('Localhost 8546 RPC');

    await addRpcUrlModal.saveAddRpcUrl();

    // Wait for RPC to be queried and chain ID to be detected
    await driver.delay(2000);

    // Fill in network details (matching onboarding test)
    await addEditNetworkModal.fillNetworkNameInputField(networkName);
    await addEditNetworkModal.fillNetworkChainIdInputField(chainId);
    await addEditNetworkModal.fillCurrencySymbolInputField(currencySymbol);

    // Wait for validation to complete
    await driver.delay(1000);

    // Save the network
    await addEditNetworkModal.saveEditedNetwork();

    // Wait for the network to be added and verify it loads
    // The saveEditedNetwork should close the modal and return to home page
    await driver.delay(1000);

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

    // Now delete the added network and revert to default network
    // First, we need to switch away from the added network (if it's currently selected)
    // because you cannot delete the currently selected network
    // Wait for home page to be ready instead of arbitrary delay
    await homePage.waitForNetworkAndDOMReady();

    const networkManager = new NetworkManager(driver);

    // Step 1: Switch to a default network first (Localhost 8545 or Ethereum)
    // We need to switch away from the added network before we can delete it
    try {
      await networkManager.openNetworkManager();
      // Wait for modal to be fully loaded instead of delay
      await driver.waitForSelector(
        '[data-testid="modal-header-close-button"]',
        {
          timeout: 5000,
        },
      );

      // Switch to Popular tab first (default networks are usually in Popular tab)
      // Networks are only visible when on the correct tab
      try {
        await networkManager.selectTab('Popular');
        // Wait for tab content to load instead of delay
        await driver
          .waitForSelector(
            '[data-testid="Localhost 8545"], [data-testid="Ethereum"]',
            {
              timeout: 3000,
              state: 'visible',
            },
          )
          .catch(() => {
            // Networks might not be visible yet, continue
          });
      } catch (tabError) {
        // Tab might already be selected, continue
        console.log('Popular tab might already be selected or not available');
      }

      // Now check which default network is available (after switching to Popular tab)
      // Use executeScript to check without waiting/timeout
      let defaultNetworkName: string | null = null;

      // Try Localhost 8545 first (most common in test environments)
      try {
        const localhostExists = (await driver.driver.executeScript(`
          return document.querySelector('[data-testid="Localhost 8545"]') !== null;
        `)) as boolean;
        if (localhostExists) {
          defaultNetworkName = 'Localhost 8545';
        }
      } catch (e) {
        // Element check failed, try next option
      }

      // If Localhost 8545 not found, try Ethereum
      if (!defaultNetworkName) {
        try {
          const ethereumExists = (await driver.driver.executeScript(`
            return document.querySelector('[data-testid="Ethereum"]') !== null;
          `)) as boolean;
          if (ethereumExists) {
            defaultNetworkName = 'Ethereum';
          }
        } catch (e) {
          // Element check failed
        }
      }

      if (defaultNetworkName) {
        await networkManager.selectNetworkByNameWithWait(defaultNetworkName);
        // Wait for network switch to complete instead of delay
        await homePage.waitForNetworkAndDOMReady();
        console.log(`Switched to default network: ${defaultNetworkName}`);
      } else {
        console.warn(
          'Could not find default network to switch to before deletion. Will attempt deletion anyway.',
        );
      }
    } catch (switchError) {
      console.warn(
        'Could not switch to default network before deletion:',
        switchError,
      );
      // Try to close modal if still open
      try {
        const isModalOpen = await driver.isElementPresent(
          '.multichain-network-list-menu-content-wrapper',
        );
        if (isModalOpen) {
          await networkManager.closeNetworkManager();
        }
      } catch (closeError) {
        // Ignore close errors
      }
    }

    // Step 2: Now delete the added network
    try {
      await networkManager.openNetworkManager();
      // Wait for modal to be fully loaded instead of delay
      await driver.waitForSelector(
        '[data-testid="modal-header-close-button"]',
        {
          timeout: 5000,
        },
      );

      // Switch to Custom networks tab to find the added network
      await networkManager.selectTab('Custom');
      // Wait for custom networks to load instead of delay
      await driver
        .waitForSelector(
          '[data-testid="network-list-item-options-button-eip155:1338"]',
          {
            timeout: 3000,
          },
        )
        .catch(() => {
          // Network might not be visible yet, continue anyway
        });

      // Delete the network by chain ID (1338 = 0x53a in hex)
      const chainIdHex = '0x53a';
      await networkManager.deleteNetworkByChainId(chainIdHex as `0x${string}`);
      // Wait for deletion to complete and modal to close instead of delay
      await driver.assertElementNotPresent(
        '.multichain-network-list-menu-content-wrapper',
        {
          timeout: 5000,
        },
      );

      console.log('Successfully deleted added network');
    } catch (deleteError) {
      console.warn('Could not delete network:', deleteError);
      // Try to close any open modals
      try {
        const isModalOpen = await driver.isElementPresent(
          '.multichain-network-list-menu-content-wrapper',
        );
        if (isModalOpen) {
          await networkManager.closeNetworkManager();
        }
      } catch (closeError) {
        console.warn('Could not close network modal:', closeError);
      }
    }
  } catch (error) {
    console.warn('Could not complete add network flow:', error);
    // Try to dismiss any error modals
    await dismissNetworkErrorModal(driver);
    // Ensure network modal is closed
    try {
      const isModalOpen = await driver.isElementPresent(
        '.multichain-network-list-menu-content-wrapper',
      );
      if (isModalOpen) {
        await selectNetwork.clickCloseButton();
        await driver.delay(500);
      }
    } catch (closeError) {
      console.warn('Could not close network modal after error:', closeError);
    }
  }
}

/**
 * Flow: Import SRP (Onboarding)
 * Tests onboarding flow performance and app load time
 * Note: This flow requires a fresh browser state (no existing wallet)
 * Uses E2E_SRP which is the same SRP used for power user persona state generation
 */
async function importSrpFlow(driver: Driver): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { E2E_SRP } = require('../default-fixture');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { WALLET_PASSWORD } = require('../helpers');

  // Use E2E_SRP - this is the same SRP used by generateWalletState for power user persona
  // When imported, this SRP will generate the same accounts as the power user state
  // (though transactions/NFTs/contacts are added programmatically, not from SRP)
  const powerUserSRP = E2E_SRP;

  // Perform the complete import SRP onboarding flow
  // This includes:
  // 1. Starting onboarding
  // 2. Importing SRP
  // 3. Creating password
  // 4. Completing onboarding
  // 5. App load to home page
  await completeImportSRPOnboardingFlow({
    driver,
    seedPhrase: powerUserSRP,
    password: WALLET_PASSWORD,
    fillSrpWordByWord: false,
    participateInMetaMetrics: false,
    dataCollectionForMarketing: false,
  });

  // Wait for home page to fully load
  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
  await homePage.waitForNetworkAndDOMReady();
  await driver.delay(1000); // Additional wait for app to stabilize
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

  // Measure time to access Send token page
  const sendPageStartTime = Date.now();
  try {
    await homePage.startSendFlow();
    await driver.delay(2000); // Wait for navigation

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

      // Select the first token in the list to proceed to amount/recipient page
      try {
        // Look for any asset in the list (native or token)
        const assetElement = await driver.waitForSelector(
          '[data-testid="multichain-token-list-button"], .redesigned-asset-component, [class*="asset"]',
          { timeout: 10000 },
        );
        await assetElement.click();
        await driver.delay(1500); // Wait for navigation to amount/recipient page
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
      // Wait for recipient input or amount input
      try {
        await driver.waitForSelector(
          '[data-testid="open-recipient-modal-btn"], [data-testid="recipient-filter-search-input"]',
          { timeout: 10000 },
        );
        console.log('Amount/recipient page loaded');
      } catch (amountPageError) {
        console.warn('Could not load amount/recipient page:', amountPageError);
      }

      const sendPageEndTime = Date.now();
      const sendPageAccessTime = sendPageEndTime - sendPageStartTime;
      console.log(`Time to access Send flow: ${sendPageAccessTime}ms`);
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

      await driver.delay(1000); // Wait for send page to initialize

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

      // Fill in recipient address (use a test address)
      const testRecipientAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      await sendTokenPage.fillRecipient(testRecipientAddress);
      await driver.delay(500);

      // Fill in amount
      await sendTokenPage.fillAmount('0.001');
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

  // Click send button to navigate to send page
  try {
    await homePage.startSendFlow();
    await driver.delay(2000); // Wait for navigation

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

      // Click on the input to ensure it's focused
      const searchInput = await driver.waitForSelector(searchInputSelector, {
        state: 'enabled',
      });
      await searchInput.click();
      await driver.delay(300);

      // Search for a token - type character by character
      for (const char of 'ETH') {
        const input = await driver.waitForSelector(searchInputSelector, {
          state: 'enabled',
        });
        await input.sendKeys(char);
        await driver.delay(100);
      }
      await driver.delay(1500); // Wait for search results

      // Clear search using clear button or keyboard
      try {
        const clearButton = await driver.findClickableElement({
          css: '[data-testid="text-field-search-clear-button"]',
        });
        if (clearButton) {
          await clearButton.click();
          await driver.delay(500);
        }
      } catch (error) {
        const input = await driver.waitForSelector(searchInputSelector, {
          state: 'enabled',
        });
        await input.sendKeys(
          driver.Key.chord(driver.Key.MODIFIER, 'a', driver.Key.BACK_SPACE),
        );
        await driver.delay(300);
      }

      // Search for another token
      const inputForSecondSearch = await driver.waitForSelector(
        searchInputSelector,
        { state: 'enabled' },
      );
      await inputForSecondSearch.click();
      await driver.delay(300);

      for (const char of 'USDC') {
        const input = await driver.waitForSelector(searchInputSelector, {
          state: 'enabled',
        });
        await input.sendKeys(char);
        await driver.delay(100);
      }
      await driver.delay(1500);
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
      await driver.delay(1500);

      // Clear search
      try {
        const clearButton = await driver.findClickableElement({
          css: '[data-testid="text-field-search-clear-button"]',
        });
        if (clearButton) {
          await clearButton.click();
          await driver.delay(500);
        }
      } catch (error) {
        const input = await driver.waitForSelector(searchInputSelector, {
          state: 'enabled',
        });
        await input.sendKeys(
          driver.Key.chord(driver.Key.MODIFIER, 'a', driver.Key.BACK_SPACE),
        );
        await driver.delay(300);
      }

      // Search for another token
      const inputForSecondSearch = await driver.waitForSelector(
        searchInputSelector,
        { state: 'enabled' },
      );
      await inputForSecondSearch.click();
      await driver.delay(300);

      for (const char of 'USDC') {
        const input = await driver.waitForSelector(searchInputSelector, {
          state: 'enabled',
        });
        await input.sendKeys(char);
        await driver.delay(100);
      }
      await driver.delay(1500);

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

    // Track scroll distance
    if (previousScrollTop >= 0) {
      lazyLoadMetrics.totalScrollDistance += Math.abs(
        currentScrollTop - previousScrollTop,
      );
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
 */
async function measureFlowMultiple(
  flowName: string,
  flowFunction: (driver: Driver) => Promise<void>,
  iterations: number,
): Promise<FlowBenchmarkResult[]> {
  const results: FlowBenchmarkResult[] = [];

  // Import SRP flow requires a fresh browser state (no existing wallet)
  const isOnboardingFlow = flowName === 'import-srp';

  await withFixtures(
    {
      title: `measureFlow-${flowName}`,
      fixtures: isOnboardingFlow
        ? // For onboarding, use proper onboarding fixture
          new FixtureBuilder({ onboarding: true }).build()
        : // For other flows, use power user state
          (await generateWalletState(WITH_STATE_POWER_USER, true)).build(),
      // Add localNodeOptions for network adding flow (needs Anvil on port 8546 with chain ID 1338)
      localNodeOptions:
        flowName === 'network-adding'
          ? [
              {
                type: 'anvil',
              },
              {
                type: 'anvil',
                options: {
                  port: 8546,
                  chainId: 1338,
                },
              },
            ]
          : 'anvil', // Default: single Anvil node on port 8545
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
      // Skip unlock for onboarding flows (they start fresh)
      if (!isOnboardingFlow) {
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
            { timeout: 20000 },
          );
          // Additional delay to ensure network is fully ready for RPC calls
          await driver.delay(3000);
        } catch (error) {
          console.warn('Balance element not found, waiting longer:', error);
          await driver.delay(5000);
        }
      }

      // Onboarding flows can only run once per browser session (they create a wallet)
      // So limit iterations to 1 for onboarding flows
      const effectiveIterations = isOnboardingFlow ? 1 : iterations;
      if (isOnboardingFlow && iterations > 1) {
        console.log(
          `Note: Onboarding flows can only run once per browser load. Limiting iterations to 1 (requested: ${iterations}). Use --browserLoads to run multiple times.`,
        );
      }

      let hasErrors = false;
      for (let i = 0; i < effectiveIterations; i++) {
        console.log(`  Iteration ${i + 1}/${effectiveIterations}`);
        try {
          const result = await measureFlow(
            flowName,
            flowFunction,
            driver,
            getNetworkReport,
            clearNetworkReport,
            i,
          );
          results.push(result);
          // Small delay between iterations
          await driver.delay(1000);
        } catch (error) {
          console.error(`Error in iteration ${i + 1}:`, error);
          hasErrors = true;
          // Continue with next iteration, but mark that we had errors
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
 * @param outputCallback - Optional callback for incremental results
 * @returns Results and flow reports
 */
async function profileFlows(
  flows: string[],
  browserLoads: number,
  iterations: number,
  retries: number,
  outputCallback?: (flowName: string, results: BenchmarkResults) => void,
): Promise<{
  results: Record<string, BenchmarkResults>;
  flowReports: FlowRunReport[];
}> {
  const results: Record<string, BenchmarkResults> = {};
  const flowReports: FlowRunReport[] = [];

  // Map flow names to functions
  const flowMap: Record<string, (driver: Driver) => Promise<void>> = {
    'tab-switching': tabSwitchingFlow,
    'account-switching': accountSwitchingFlow,
    'network-switching': networkSwitchingFlow,
    'network-adding': networkAddingFlow,
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
            measureFlowMultiple(flowName, flowFunction, iterations),
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

      for (const key of metricKeys) {
        const values = runResults
          .map((r) => {
            // Handle nested properties like 'navigation[0].load'
            const value = get(r.metrics, key);
            return typeof value === 'number' ? value : null;
          })
          .filter((v): v is number => v !== null)
          .sort((a, b) => a - b);

        if (values.length > 0) {
          result[key] = values;
        }
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
        }),
  ) as unknown as { argv: FlowBenchmarkArguments };

  const { flows, browserLoads, iterations, out, retries } = argv;

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
