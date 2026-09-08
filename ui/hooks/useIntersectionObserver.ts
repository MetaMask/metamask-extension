import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type State = {
  isIntersecting: boolean;
  entry?: IntersectionObserverEntry;
};

type UseIntersectionObserverOptions = {
  root?: Element | Document | null;
  rootMargin?: string;
  threshold?: number | number[];
  onChange?: (
    isIntersecting: boolean,
    entry: IntersectionObserverEntry,
  ) => void;
  initialIsIntersecting?: boolean;
};

type IntersectionReturn = [
  (node?: Element | null) => void,
  boolean,
  IntersectionObserverEntry | undefined,
] & {
  ref: (node?: Element | null) => void;
  isIntersecting: boolean;
  entry?: IntersectionObserverEntry;
};

function meetsThreshold(
  entry: IntersectionObserverEntry,
  thresholds: readonly number[],
) {
  for (const observerThreshold of thresholds) {
    if (entry.intersectionRatio >= observerThreshold) {
      return true;
    }
  }

  return false;
}

export function useIntersectionObserver({
  threshold = 0,
  root = null,
  rootMargin = '0%',
  initialIsIntersecting = false,
  onChange,
}: UseIntersectionObserverOptions = {}): IntersectionReturn {
  const [ref, setRef] = useState<Element | null>(null);
  const [state, setState] = useState<State>(() => ({
    isIntersecting: initialIsIntersecting,
    entry: undefined,
  }));
  const callbackRef = useRef(onChange);
  const thresholdRef = useRef(threshold);
  const thresholdKey = Array.isArray(threshold)
    ? threshold.join(',')
    : String(threshold);

  callbackRef.current = onChange;
  thresholdRef.current = threshold;

  useEffect(() => {
    if (!ref || !('IntersectionObserver' in globalThis)) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        for (const entry of entries) {
          const isIntersecting =
            entry.isIntersecting && meetsThreshold(entry, observer.thresholds);

          setState({ isIntersecting, entry });
          callbackRef.current?.(isIntersecting, entry);
        }
      },
      { threshold: thresholdRef.current, root, rootMargin },
    );

    observer.observe(ref);

    return () => {
      observer.disconnect();
    };
  }, [ref, thresholdKey, root, rootMargin]);

  const setRefCallback = useCallback(
    (node?: Element | null) => {
      setRef(node ?? null);
      if (!node) {
        setState({ isIntersecting: initialIsIntersecting, entry: undefined });
      }
    },
    [initialIsIntersecting],
  );

  const result = useMemo(
    () =>
      [
        setRefCallback,
        Boolean(state.isIntersecting),
        state.entry,
      ] as IntersectionReturn,
    [setRefCallback, state.entry, state.isIntersecting],
  );

  result.ref = result[0];
  result.isIntersecting = result[1];
  result.entry = result[2];

  return result;
}
