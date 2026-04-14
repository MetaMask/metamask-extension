import { useEffect } from 'react';
import { useCssVar } from './useCssVar';

export function useHideToasts() {
  const toastDisplay = useCssVar({ name: '--toast-display' });

  useEffect(() => {
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
