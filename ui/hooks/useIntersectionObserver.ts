import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';

type State = {
  isIntersecting: boolean;
  entry?: IntersectionObserverEntry;
};

type UseIntersectionObserverOptions = {
  root?: Element | Document | null;
  rootRef?: RefObject<Element | null>;
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

  useEffect(() => {
    callbackRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    thresholdRef.current = threshold;
  }, [threshold]);

  if (!ref && state.entry?.target) {
    setState({ isIntersecting: initialIsIntersecting, entry: undefined });
  }

  useEffect(() => {
    if (!ref || !('IntersectionObserver' in globalThis)) {
      return undefined;
    }

    const resolvedRoot = rootRef ? rootRef.current : root;

    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        for (const entry of entries) {
          const isIntersecting =
            entry.isIntersecting && meetsThreshold(entry, observer.thresholds);

          setState({ isIntersecting, entry });
          callbackRef.current?.(isIntersecting, entry);
        }
      },
      { threshold: thresholdRef.current, root: resolvedRoot, rootMargin },
    );

    observer.observe(ref);

    return () => {
      observer.disconnect();
    };
  }, [ref, thresholdKey, root, rootMargin, rootRef]);

  return useMemo((): IntersectionReturn => {
    const setRefFn = setRef;
    const isIntersecting = Boolean(state.isIntersecting);
    const { entry } = state;
    const tuple = [
      setRefFn,
      isIntersecting,
      entry,
    ] as unknown as IntersectionReturn;
    tuple.ref = setRefFn;
    tuple.isIntersecting = isIntersecting;
    tuple.entry = entry;
    return tuple;
  }, [state]);
}
