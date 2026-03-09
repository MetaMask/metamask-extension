import { getBrowserName } from '../../../shared/modules/browser-runtime.utils';
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
  direction: 'forward' | 'back',
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
