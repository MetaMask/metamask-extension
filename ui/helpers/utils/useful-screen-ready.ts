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

type Sections = {
  unlock: 'form';
  home: 'account' | 'assets';
  confirmation: 'details' | 'actions';
};

export type UsefulScreen = keyof Sections;

export type UsefulScreenSignal = {
  [Screen in UsefulScreen]: {
    screen: Screen;
    section: Sections[Screen];
    /** Local identity only; never attached to telemetry. */
    generation: string;
  };
}[UsefulScreen];

const requiredSections: Record<UsefulScreen, readonly string[]> = {
  unlock: ['form'],
  home: ['account', 'assets'],
  confirmation: ['details', 'actions'],
};

type StartupOptions = {
  isUnlocked: boolean;
  uiType: EnvironmentType;
  backgroundInitializedAt?: number;
};

type Navigation = {
  key: string;
  pathname: string;
  navigationType: string;
};

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

/**
 * Measure one initial useful screen from document navigation. Readiness means
 * the required sections committed, followed by two animation frames. This is
 * a paint opportunity proxy, not a browser-reported paint timestamp.
 *
 * Startup REPLACE redirects are allowed. User navigation, hidden documents,
 * unsupported routes, and unmounted sections cannot complete a measurement.
 * No span is created until readiness, avoiding incomplete startup transactions.
 *
 * @param options - Immutable initial wallet and UI context.
 * @param options.isUnlocked
 * @param options.uiType
 * @param options.backgroundInitializedAt
 * @returns The navigation and section lifecycle handlers for this document.
 */
export function createUsefulScreenReadyTrace({
  isUnlocked,
  uiType,
  backgroundInitializedAt,
}: StartupOptions) {
  const startTime = performance.timeOrigin;
  let routeKey: string | undefined;
  let routeScreen: UsefulScreen | undefined;
  let finished = false;
  let frame: number | undefined;
  let current:
    | {
        screen: UsefulScreen;
        generation: string;
        sections: Map<string, symbol>;
      }
    | undefined;

  const cancelFrame = () => {
    if (frame !== undefined) {
      cancelAnimationFrame(frame);
      frame = undefined;
    }
  };

  const discard = () => {
    finished = true;
    cancelFrame();
    current = undefined;
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('pagehide', discard);
  };

  function onVisibilityChange() {
    if (document.visibilityState !== 'visible') {
      discard();
    }
  }

  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('pagehide', discard);
  onVisibilityChange();

  return {
    discard,
    observeNavigation({ key, pathname, navigationType }: Navigation) {
      if (finished || routeKey === key) {
        return;
      }
      if (
        !getScreenForPath(pathname) ||
        (routeKey !== undefined && navigationType !== 'REPLACE')
      ) {
        discard();
        return;
      }
      cancelFrame();
      current = undefined;
      routeKey = key;
      routeScreen = getScreenForPath(pathname);
    },
    signalReady(
      key: string,
      { screen, section, generation }: UsefulScreenSignal,
    ) {
      if (
        finished ||
        key !== routeKey ||
        screen !== routeScreen ||
        (screen === 'unlock' ? isUnlocked : !isUnlocked)
      ) {
        return undefined;
      }
      if (current?.screen !== screen || current.generation !== generation) {
        cancelFrame();
        current = { screen, generation, sections: new Map() };
      }
      const measurement = current;
      const token = Symbol(section);
      measurement.sections.set(section, token);

      if (
        frame === undefined &&
        requiredSections[screen].every((name) => measurement.sections.has(name))
      ) {
        frame = requestAnimationFrame(() => {
          frame = requestAnimationFrame(() => {
            if (document.visibilityState !== 'visible') {
              discard();
              return;
            }
            const timestamp = getPerformanceTimestamp();
            discard();
            trace({
              name: TraceName.UsefulScreenReady,
              op: TraceOperation.UiScreenPerformance,
              startTime,
              tags: {
                screen,
                'wallet.ui_type': uiType,
                'wallet.unlocked': isUnlocked,
                'ui.navigation': 'document',
                'ui.readiness_version': '1',
                'ui.background_initialized_before_navigation':
                  backgroundInitializedAt === undefined
                    ? 'unknown'
                    : backgroundInitializedAt <= startTime,
              },
              data: { success: true },
            });
            endTrace({ name: TraceName.UsefulScreenReady, timestamp });
          });
        });
      }

      return () => {
        if (measurement.sections.get(section) === token) {
          measurement.sections.delete(section);
          if (current === measurement) {
            cancelFrame();
          }
        }
      };
    },
  };
}

let startupTrace: ReturnType<typeof createUsefulScreenReadyTrace> | undefined;
/**
 * Capture initial state before rendering the app; subsequent initialization
 * calls cannot restart the document's initial-load measurement.
 *
 * @param options - Initial state received from the background.
 */
export function initializeUsefulScreenReadyTrace(
  options: Omit<StartupOptions, 'backgroundInitializedAt'>,
): void {
  startupTrace ??= createUsefulScreenReadyTrace({
    ...options,
    backgroundInitializedAt: getBackgroundInitializedAt(),
  });
}

/**
 * Track committed router navigation before section effects run.
 *
 * @param navigation - The committed router location and navigation type.
 */
export function observeUsefulScreenNavigation(navigation: Navigation): void {
  startupTrace?.observeNavigation(navigation);
}

/**
 * Register a committed section, returning its unmount cleanup.
 *
 * @param key - Router location identity, kept local.
 * @param signal - A section and its local account/request generation.
 * @returns Cleanup that withdraws readiness if the section unmounts.
 */
export function signalUsefulScreenReady(
  key: string,
  signal: UsefulScreenSignal,
) {
  return startupTrace?.signalReady(key, signal);
}
