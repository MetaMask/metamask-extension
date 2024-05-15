import { useCallback, useEffect, useRef } from 'react';
import { throttle } from 'lodash';

export function useThrottle(cb, delay) {
  const cbRef = useRef(cb);
  useEffect(() => {
    cbRef.current = cb;
  });
  return useCallback(
    throttle((...args) => cbRef.current(...args), delay),
    [delay],
  );
}
