import { useLayoutEffect } from 'react';
import { useCssVar } from './useCssVar';

const toastCssVariable = '--toast-visibility';

export function useHideToasts() {
  const toastVisibility = useCssVar({ name: toastCssVariable });

  useLayoutEffect(() => {
    const previousValue = toastVisibility.get();
    toastVisibility.set('hidden');

    return () => {
      if (previousValue) {
        toastVisibility.set(previousValue);
      } else {
        toastVisibility.remove();
      }
    };
  }, [toastVisibility]);
}
