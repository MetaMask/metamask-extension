import { createContext, useContext, useEffect, useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import {
  observeUsefulScreenNavigation,
  signalUsefulScreenReady,
  type UsefulScreenSignal,
} from '../helpers/utils/useful-screen-ready';

/** Track initial navigation and cancel readiness on subsequent user navigation. */
export function useUsefulScreenReadyNavigation(): void {
  const { key, pathname } = useLocation();
  const navigationType = useNavigationType();
  useLayoutEffect(() => {
    observeUsefulScreenNavigation({ key, pathname, navigationType });
  }, [key, pathname, navigationType]);
}

export type UsefulScreenReadyProps = UsefulScreenSignal & { ready: boolean };

// A missing provider disables instrumentation in isolated views and stories.
export const UsefulScreenReadyContext = createContext<string | undefined>(
  undefined,
);

/**
 * Signal a committed section without adding state or triggering a render.
 *
 * @param options - Screen-specific readiness and local account/request identity.
 * @param options.screen
 * @param options.section
 * @param options.generation
 * @param options.ready
 */
export function useUsefulScreenReady({
  screen,
  section,
  generation,
  ready,
}: UsefulScreenReadyProps): void {
  const key = useContext(UsefulScreenReadyContext);
  useEffect(() => {
    if (!ready || key === undefined) {
      return undefined;
    }
    return signalUsefulScreenReady(key, {
      screen,
      section,
      generation,
    } as UsefulScreenSignal);
  }, [key, screen, section, generation, ready]);
}

/**
 * A readiness marker for screens that cannot call hooks in their render body.
 * @param props
 * @param props.screen
 * @param props.section
 * @param props.generation
 * @param props.ready
 */
export function UsefulScreenReady({
  screen,
  section,
  generation,
  ready,
}: UsefulScreenReadyProps): null {
  useUsefulScreenReady({
    screen,
    section,
    generation,
    ready,
  } as UsefulScreenReadyProps);
  return null;
}
