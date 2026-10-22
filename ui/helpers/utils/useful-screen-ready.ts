import type { EnvironmentType } from '../../../shared/constants/app';
import { getBackgroundInitializedAt } from '../../../shared/lib/ui-startup-timing';
import {
  endTrace,
  getPerformanceTimestamp,
  trace,
  TraceName,
  TraceOperation,
} from '../../../shared/lib/trace';
import {
  CONFIRMATION_V_NEXT_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  DEFAULT_ROUTE,
  UNLOCK_ROUTE,
} from '../constants/routes';

export type UsefulScreen = 'unlock' | 'home' | 'confirmation';
type StartupOptions = { isUnlocked: boolean; uiType: EnvironmentType };
type Navigation = { key: string; pathname: string; navigationType: string };

// startApp captures this before rendering the router or readiness markers.
let startup: StartupOptions & { backgroundInitializedAt?: number };
let route:
  | { key: string; screen: UsefulScreen; confirmationId?: string }
  | undefined;
let finished = false;

function getScreenForPath(pathname: string): UsefulScreen | undefined {
  if (pathname === DEFAULT_ROUTE) {
    return 'home';
  }
  if (pathname === UNLOCK_ROUTE) {
    return 'unlock';
  }
  if (
    [CONFIRM_TRANSACTION_ROUTE, CONFIRMATION_V_NEXT_ROUTE].some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    )
  ) {
    return 'confirmation';
  }
  return undefined;
}

/** Permanently exclude this document from useful-screen readiness sampling. */
export function discardUsefulScreenReadyTrace(): void {
  finished = true;
  document.removeEventListener('visibilitychange', onVisibilityChange);
  window.removeEventListener('pagehide', discardUsefulScreenReadyTrace);
}

function onVisibilityChange(): void {
  if (document.visibilityState !== 'visible') {
    discardUsefulScreenReadyTrace();
  }
}

/** Track document visibility before waiting for background initialization. */
export function trackUsefulScreenVisibility(): void {
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('pagehide', discardUsefulScreenReadyTrace);
  // The bundle itself may have loaded after the document became visible.
  const visibilityEntries = performance.getEntriesByType('visibility-state');
  if (visibilityEntries.some((entry) => entry.name === 'hidden')) {
    discardUsefulScreenReadyTrace();
  }
  onVisibilityChange();
}

/**
 * Capture the initial wallet state once, before React renders.
 * @param options - Initial state received from the background.
 */
export function initializeUsefulScreenReadyTrace(
  options: StartupOptions,
): void {
  startup = {
    ...options,
    backgroundInitializedAt: getBackgroundInitializedAt(),
  };
}

/**
 * Allow startup redirects, but abandon timing after user navigation.
 * @param navigation - The committed router location and navigation type.
 * @param navigation.key
 * @param navigation.pathname
 * @param navigation.navigationType
 */
export function observeUsefulScreenNavigation({
  key,
  pathname,
  navigationType,
}: Navigation): void {
  if (finished || route?.key === key) {
    return;
  }
  const screen = getScreenForPath(pathname);
  const confirmationId =
    screen === 'confirmation' ? pathname.split('/')[2] || undefined : undefined;
  if (
    !screen ||
    (route && navigationType !== 'REPLACE') ||
    (route?.confirmationId && confirmationId !== route.confirmationId)
  ) {
    discardUsefulScreenReadyTrace();
    return;
  }
  // A REPLACE can also follow approval/rejection or switching pending requests.
  // Keep the first request identity local, without adding it to telemetry.
  route = { key, screen, confirmationId };
}

/**
 * Report one initial useful screen after its commit and paint opportunity.
 * @param key - Router location identity, kept local.
 * @param screen - The screen whose useful content committed.
 */
export function reportUsefulScreenReady(
  key: string,
  screen: UsefulScreen,
): void {
  if (
    finished ||
    route?.key !== key ||
    route.screen !== screen ||
    (screen === 'unlock' ? startup.isUnlocked : !startup.isUnlocked)
  ) {
    return;
  }
  const timestamp = getPerformanceTimestamp();
  discardUsefulScreenReadyTrace();
  trace({
    name: TraceName.UsefulScreenReady,
    op: TraceOperation.UiScreenPerformance,
    startTime: performance.timeOrigin,
    tags: {
      screen,
      'wallet.ui_type': startup.uiType,
      'wallet.unlocked': startup.isUnlocked,
      'ui.navigation': 'document',
      'ui.readiness_version': '1',
      'ui.background_initialized_before_navigation':
        startup.backgroundInitializedAt === undefined
          ? 'unknown'
          : startup.backgroundInitializedAt <= performance.timeOrigin,
    },
    data: { success: true },
  });
  endTrace({ name: TraceName.UsefulScreenReady, timestamp });
}
