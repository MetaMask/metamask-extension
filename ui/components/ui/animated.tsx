import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
} from 'react';
import { getBrowserName } from '../../../shared/modules/browser-runtime.utils';
import { PLATFORM_FIREFOX } from '../../../shared/constants/app';

type TriggerExit = (onComplete: () => void) => void;

export type AnimatedRef = {
  triggerExit: TriggerExit;
};

const AnimatedContext = createContext<TriggerExit | null>(null);

export const useAnimatedExit = (): TriggerExit => {
  const ctx = useContext(AnimatedContext);
  return ctx ?? ((cb) => cb());
};

const isTransitionSupported = (): boolean => {
  if (process.env.IN_TEST) {
    return false;
  }
  if (getBrowserName() === PLATFORM_FIREFOX) {
    return false;
  }
  return Boolean(document.startViewTransition);
};

// Cache the result so we don't re-evaluate on every render
const transitionSupported = isTransitionSupported();

/**
 * Wraps a callback in a View Transition so the browser crossfades
 * the old and new DOM snapshots. Use this for navigations that
 * originate from pages that don't have an `<Animated>` wrapper
 * (e.g. navigating FROM home TO another page).
 */
export const withViewTransition = (callback: () => void): void => {
  if (!transitionSupported) {
    callback();
    return;
  }
  console.log('>>> [Animated] withViewTransition (forward)');
  document.documentElement.dataset.pageTransition = 'forward';
  const transition = document.startViewTransition(callback);
  transition.finished
    .then(() => {
      delete document.documentElement.dataset.pageTransition;
    })
    .catch(() => {
      delete document.documentElement.dataset.pageTransition;
    });
};

export const Animated = forwardRef<AnimatedRef, { children: React.ReactNode }>(
  ({ children }, fwdRef) => {
    const triggerExit: TriggerExit = useCallback((onComplete) => {
      console.log('>>> [Animated] triggerExit (back)');
      if (!transitionSupported) {
        onComplete();
        return;
      }

      document.documentElement.dataset.pageTransition = 'back';
      const transition = document.startViewTransition(onComplete);
      transition.ready
        .then(() => console.log('>>> [Animated] transition ready'))
        .catch(() => undefined);
      transition.finished
        .then(() => {
          delete document.documentElement.dataset.pageTransition;
          console.log('>>> [Animated] transition finished');
        })
        .catch(() => {
          delete document.documentElement.dataset.pageTransition;
        });
    }, []);

    useImperativeHandle(fwdRef, () => ({ triggerExit }), [triggerExit]);

    return (
      <AnimatedContext.Provider value={triggerExit}>
        <div className="h-full">{children}</div>
      </AnimatedContext.Provider>
    );
  },
);

Animated.displayName = 'Animated';
