import { useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';

type State = {
  isIntersecting: boolean;
  entry?: IntersectionObserverEntry;
};

type UseIntersectionObserverOptions = {
  root?: Element | Document | null;
  rootRef?: RefObject<Element | Document | null>;
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
  rootRef,
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

    const rootElement = rootRef?.current ?? root ?? null;

    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        for (const entry of entries) {
          const isIntersecting =
            entry.isIntersecting && meetsThreshold(entry, observer.thresholds);

          setState({ isIntersecting, entry });
          callbackRef.current?.(isIntersecting, entry);
        }
      },
      { threshold: thresholdRef.current, root: rootElement, rootMargin },
    );

    observer.observe(ref);

    return () => {
      observer.disconnect();
    };
  }, [ref, thresholdKey, root, rootRef, rootMargin]);

  useEffect(() => {
    if (!ref && state.entry?.target) {
      setState({ isIntersecting: initialIsIntersecting, entry: undefined });
    }
  }, [ref, state.entry, initialIsIntersecting]);

  const result = useMemo(
    () =>
      [
        setRef,
        Boolean(state.isIntersecting),
        state.entry,
      ] as IntersectionReturn,
    [state.entry, state.isIntersecting],
  );

  result.ref = result[0];
  result.isIntersecting = result[1];
  result.entry = result[2];

  return result;
}
