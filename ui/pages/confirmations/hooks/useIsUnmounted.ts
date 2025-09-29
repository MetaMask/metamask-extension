import { useCallback, useEffect, useRef } from 'react';

export function useIsUnmounted() {
  const unmountedRef = useRef(false);

  useEffect(() => {
    return () => {
      unmountedRef.current = true;
    };
  }, []);

  return useCallback(() => unmountedRef.current, [unmountedRef.current]);
}
