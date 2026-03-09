import { getBrowserName } from '../../../shared/modules/browser-runtime.utils';
import { PLATFORM_FIREFOX } from '../../../shared/constants/app';

const isTransitionSupported = () => {
  if (process.env.IN_TEST || getBrowserName() === PLATFORM_FIREFOX) {
    return false;
  }

  return Boolean(document.startViewTransition);
};

const transitionSupported = isTransitionSupported();

const startTransition = (
  direction: 'forward' | 'back',
  callback: () => void,
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

export const transitionForward = (callback: () => void) => {
  startTransition('forward', callback);
};

export const transitionBack = (callback: () => void) => {
  startTransition('back', callback);
};
