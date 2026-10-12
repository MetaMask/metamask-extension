import { createContext, useContext, useEffect, useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import {
  observeUsefulScreenNavigation,
  reportUsefulScreenReady,
  type UsefulScreen,
} from '../helpers/utils/useful-screen-ready';

// A missing provider disables instrumentation in isolated views and stories.
export const UsefulScreenReadyContext = createContext<string | undefined>(
  undefined,
);

/** Observe router commits before readiness effects run. */
export function useUsefulScreenReadyNavigation(): void {
  const { key, pathname } = useLocation();
  const navigationType = useNavigationType();
  useLayoutEffect(() => {
    observeUsefulScreenNavigation({ key, pathname, navigationType });
  }, [key, pathname, navigationType]);
}

/**
 * Report committed useful content after two frames (a paint opportunity proxy).
 * Becoming unready, unmounting, or changing route cancels a pending report.
 * @param screen - The initial screen being measured.
 * @param ready - Whether its useful content is available.
 */
export function useUsefulScreenReady(screen: UsefulScreen, ready = true): void {
  const key = useContext(UsefulScreenReadyContext);
  useEffect(() => {
    if (!ready || key === undefined) {
      return undefined;
    }
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => reportUsefulScreenReady(key, screen));
    });
    return () => cancelAnimationFrame(frame);
  }, [key, screen, ready]);
}

/**
 * JSX marker for the existing class-based Unlock screen.
 * @param options0
 * @param options0.screen
 * @param options0.ready
 */
export function UsefulScreenReady({
  screen,
  ready,
}: {
  screen: UsefulScreen;
  ready: boolean;
}): null {
  useUsefulScreenReady(screen, ready);
  return null;
}
