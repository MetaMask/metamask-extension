import { getBrowserName } from '../../../shared/lib/browser-runtime.utils';
import { PLATFORM_FIREFOX } from '../../../shared/constants/app';

const isTransitionSupported = () => {
  if (process.env.IN_TEST || getBrowserName() === PLATFORM_FIREFOX) {
    return false;
  }

  return Boolean(document.startViewTransition);
};

const transitionSupported = isTransitionSupported();
type TransitionCallback = () => void | Promise<void>;

const startTransition = (
  direction: 'forward' | 'back' | 'slide-forward' | 'slide-back',
  callback: TransitionCallback,
) => {
  if (!transitionSupported) {
    callback();
    return;
  }
  document.documentElement.dataset.pageTransition = direction;
  const transition = document.startViewTransition(callback);
  transition.finished.finally(() => {
    delete document.documentElement.dataset.pageTransition;
  });
};

export const transitionForward = (callback: TransitionCallback) => {
  startTransition('forward', callback);
};

export const transitionBack = (callback: TransitionCallback) => {
  startTransition('back', callback);
};

/**
 * Slides the incoming page in from the right (and the outgoing page out to the
 * left), mirroring the drawer-style motion of the global menu.
 *
 * @param callback - The navigation (or DOM-updating) work to run inside the transition.
 */
export const transitionSlideForward = (callback: TransitionCallback) => {
  startTransition('slide-forward', callback);
};

/**
 * Reverse of {@link transitionSlideForward}: slides the incoming page in from
 * the left.
 *
 * @param callback - The navigation (or DOM-updating) work to run inside the transition.
 */
export const transitionSlideBack = (callback: TransitionCallback) => {
  startTransition('slide-back', callback);
};
