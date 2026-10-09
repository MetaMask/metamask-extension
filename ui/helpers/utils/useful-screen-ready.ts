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

let startup:
  | (StartupOptions & { backgroundInitializedAt?: number })
  | undefined;
let route: { key: string; screen: UsefulScreen } | undefined;
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

function discard(): void {
  finished = true;
  document.removeEventListener('visibilitychange', onVisibilityChange);
  window.removeEventListener('pagehide', discard);
}

function onVisibilityChange(): void {
  if (document.visibilityState !== 'visible') {
    discard();
  }
}

/**
 * Capture the initial wallet state once, before React renders.
 * @param options - Initial state received from the background.
 */
export function initializeUsefulScreenReadyTrace(
  options: StartupOptions,
): void {
  if (startup) {
    return;
  }
  startup = {
    ...options,
    backgroundInitializedAt: getBackgroundInitializedAt(),
  };
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('pagehide', discard);
  onVisibilityChange();
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
  if (!startup || finished || route?.key === key) {
    return;
  }
  const screen = getScreenForPath(pathname);
  if (!screen || (route && navigationType !== 'REPLACE')) {
    discard();
    return;
  }
  route = { key, screen };
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
    !startup ||
    finished ||
    route?.key !== key ||
    route.screen !== screen ||
    (screen === 'unlock' ? startup.isUnlocked : !startup.isUnlocked) ||
    document.visibilityState !== 'visible'
  ) {
    return;
  }
  const timestamp = getPerformanceTimestamp();
  discard();
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
