import { useEffect, useMemo, useRef } from 'react';

export function useIsUnmounted() {
  const unmountedRef = useRef(false);

  useEffect(() => {
    return () => {
      unmountedRef.current = true;
    };
  }, []);

  return useMemo(() => unmountedRef.current, [unmountedRef.current]);
}
