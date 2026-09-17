import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';

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

  useEffect(() => {
    callbackRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    thresholdRef.current = threshold;
  }, [threshold]);

  const [observerRoot, setObserverRoot] = useState<Element | Document | null>(
    null,
  );

  // Re-read rootRef every commit; the ref object is stable while `.current` is set
  // when the scroll container mounts (see activity list + ScrollContainer).
  useLayoutEffect(() => {
    const nextRoot = rootRef?.current ?? root ?? null;
    setObserverRoot((previous) =>
      previous === nextRoot ? previous : nextRoot,
    );
  });

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
      { threshold: thresholdRef.current, root: observerRoot, rootMargin },
    );

    observer.observe(ref);

    return () => {
      observer.disconnect();
    };
  }, [ref, thresholdKey, observerRoot, rootMargin]);

  const setRefFn = useCallback(
    (node?: Element | null) => {
      setRef(node ?? null);
      if (!node) {
        setState({ isIntersecting: initialIsIntersecting, entry: undefined });
      }
    },
    [initialIsIntersecting],
  );

  return useMemo((): IntersectionReturn => {
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
  }, [setRefFn, state]);
}
