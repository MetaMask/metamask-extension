/**
 * Web Vitals collection for E2E benchmarks.
 *
 * Measurement strategy per metric:
 *
 * **INP** — Two-tier: (1) `stateHooks.getWebVitalsMetrics()` from the
 * `onINP` observer with `{ reportAllChanges: true }`, capturing INP from
 * real WebDriver interactions. (2) PerformanceObserver (`event` type,
 * `buffered: true`) + Selenium Actions probe generating a trusted pointer
 * interaction with a 16ms busy-wait handler. Falls back to CDP
 * `Input.dispatchMouseEvent` if Actions API is unavailable.
 *
 * **FCP** — Read from `performance.getEntriesByType('paint')`.
 *
 * **LCP** — (1) PerformanceObserver (`largest-contentful-paint`), then
 * (2) `performance.mark('mm-hero-painted')` set by `AccountOverviewLayout`
 * after hero content renders, then null.
 *
 * **CLS** — PerformanceObserver (`layout-shift` type).
 * Falls back to 0 on extension pages where the observer is unsupported.
 */

import { readFileSync } from 'fs';
import path from 'path';

import { WINDOW_TITLES } from '../../constants';
import type { Driver } from '../../webdriver/driver';
import type { WebVitalsMetrics } from '../../../../shared/constants/benchmarks';

/**
 * Setup script: creates PerformanceObservers for event timing, LCP,
 * and CLS; reads FCP from paint entries; registers a busy-wait
 * pointerdown handler for the INP probe.
 * Stores state on `window.__cwv` for the read script.
 */
const SETUP_SCRIPT = readFileSync(
  path.join(__dirname, 'cwv-setup.js'),
  'utf-8',
);

/**
 * Read script: computes metrics from observer entries, paint timing,
 * and stateHooks (web-vitals library).
 *
 * INP priority: stateHooks (captures real interactions since page load)
 * → direct PerformanceObserver entries (probe + buffered) → null.
 * FCP from paint entries.
 * LCP from stateHooks → PerformanceObserver → mm-hero-painted mark.
 * CLS from stateHooks first, then observer entries as fallback.
 */
const READ_SCRIPT = readFileSync(path.join(__dirname, 'cwv-read.js'), 'utf-8');

const CDP_MOUSE_BASE = {
  x: 100,
  y: 100,
  button: 'left' as const,
  clickCount: 1,
};

/**
 * Dispatch a trusted pointer interaction to generate PerformanceEventTiming.
 *
 * Tries Selenium Actions API first (W3C WebDriver protocol, same mechanism
 * used for all other clicks in the test suite), then falls back to CDP
 * `Input.dispatchMouseEvent`. Clicks at (100,100) away from interactive
 * elements. The `pointerdown` busy-wait handler in the setup script ensures
 * non-zero `duration` on the resulting PerformanceEventTiming entry.
 *
 * @param driver - MetaMask Driver wrapper with Selenium driver at `.driver`
 */
async function dispatchINPProbe(driver: Driver): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const innerDriver = (driver as any).driver;
  if (!innerDriver) {
    return;
  }

  // Approach 1: Selenium W3C Actions API
  if (innerDriver.actions) {
    try {
      await innerDriver
        .actions({ async: true })
        .move({ x: CDP_MOUSE_BASE.x, y: CDP_MOUSE_BASE.y })
        .click()
        .perform();
      return;
    } catch {
      // Actions failed — fall through to CDP
    }
  }

  // Approach 2: CDP sendDevToolsCommand (ChromeDriver-specific)
  if (innerDriver.sendDevToolsCommand) {
    try {
      await innerDriver.sendDevToolsCommand('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        ...CDP_MOUSE_BASE,
      });
      await innerDriver.sendDevToolsCommand('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        ...CDP_MOUSE_BASE,
      });
    } catch {
      // CDP unavailable — fall through with whatever entries exist
    }
  }
}

/**
 * Collect web vitals from the running extension.
 *
 * INP: stateHooks (web-vitals `onINP`, running since page startup)
 * is the primary source — it captures real INP from WebDriver
 * interactions during the benchmark. A Selenium Actions probe
 * provides a secondary signal via direct PerformanceObserver entries.
 *
 * FCP: paint timing entries (always available on extension pages).
 * LCP: stateHooks → `largest-contentful-paint` observer →
 * `mm-hero-painted` mark → null.
 * CLS: stateHooks → `layout-shift` observer → 0 fallback.
 *
 * @param driver - Selenium WebDriver instance with access to the extension page
 * @returns Per-run web vitals snapshot (with `cwvDiagnostic` for debugging)
 */
export async function collectWebVitals(
  driver: Driver,
): Promise<WebVitalsMetrics> {
  // Ensure driver context is the extension page (not a dapp tab).
  // Benchmarks run in extension; explicit switch avoids wrong-context reads.
  try {
    await driver.switchToWindowWithTitle(
      WINDOW_TITLES.ExtensionInFullScreenView,
    );
  } catch {
    try {
      // Fallback: try MetaMask Dialog (e.g. confirmation popup)
      await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    } catch {
      // Neither window found — proceed with current context
      console.warn(
        '[web-vitals-collector] No extension or dialog window found, using current context',
      );
    }
  }

  await driver.executeScript(SETUP_SCRIPT);

  await dispatchINPProbe(driver);

  // Let observer callbacks + PerformanceEventTiming entries settle.
  // 500ms allows the web-vitals library's rAF-deferred processing to complete.
  await driver.delay(500);

  const raw = (await driver.executeScript(READ_SCRIPT)) as WebVitalsMetrics & {
    cwvDiagnostic?: Record<string, unknown>;
  };

  if (raw.cwvDiagnostic) {
    console.info('[web-vitals-collector] diagnostic:', raw.cwvDiagnostic);
    delete raw.cwvDiagnostic;
  }

  return raw;
}
