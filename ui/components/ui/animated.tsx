import { getBrowserName } from '../../../shared/modules/browser-runtime.utils';
import { PLATFORM_FIREFOX } from '../../../shared/constants/app';

const isTransitionSupported = (): boolean => {
  if (process.env.IN_TEST) {
    return false;
  }
  if (getBrowserName() === PLATFORM_FIREFOX) {
    return false;
  }
  return Boolean(document.startViewTransition);
};

const transitionSupported = isTransitionSupported();

const startTransition = (
  direction: 'forward' | 'back',
  callback: () => void,
): void => {
  if (!transitionSupported) {
    callback();
    return;
  }
  document.documentElement.dataset.pageTransition = direction;
  const transition = document.startViewTransition(callback);
  transition.finished
    .then(() => {
      delete document.documentElement.dataset.pageTransition;
    })
    .catch(() => {
      delete document.documentElement.dataset.pageTransition;
    });
};

/**
 * Navigates forward (e.g. home → page) with a view transition.
 * The incoming page gets a scale+fade effect; the outgoing page only fades.
 */
export const navigateForward = (callback: () => void): void => {
  startTransition('forward', callback);
};

/**
 * Navigates back (e.g. page → home) with a view transition.
 * The outgoing page gets a scale+fade effect; the incoming page only fades.
 */
export const navigateBack = (callback: () => void): void => {
  startTransition('back', callback);
};
