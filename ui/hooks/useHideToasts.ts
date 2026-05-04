import { useLayoutEffect } from 'react';
import { useCssVar } from './useCssVar';

const toastCssVariable = '--toast-display';

export function useHideToasts() {
  const toastDisplay = useCssVar({ name: toastCssVariable });

  useLayoutEffect(() => {
    const previousValue = toastDisplay.get();
    toastDisplay.set('none');

    return () => {
      if (previousValue) {
        toastDisplay.set(previousValue);
      } else {
        toastDisplay.remove();
      }
    };
  }, [toastDisplay]);
}
