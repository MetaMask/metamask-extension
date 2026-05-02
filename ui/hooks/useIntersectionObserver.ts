import { useEffect, useMemo, useRef, useState } from 'react';

type State = {
  isIntersecting: boolean;
  entry?: IntersectionObserverEntry;
};

type UseIntersectionObserverOptions = {
  root?: Element | Document | null;
  rootMargin?: string;
  threshold?: number | number[];
  freezeOnceVisible?: boolean;
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

export function useIntersectionObserver({
  threshold = 0,
  root = null,
  rootMargin = '0%',
  freezeOnceVisible = false,
  initialIsIntersecting = false,
  onChange,
}: UseIntersectionObserverOptions = {}): IntersectionReturn {
  const [ref, setRef] = useState<Element | null>(null);
  const [state, setState] = useState<State>(() => ({
    isIntersecting: initialIsIntersecting,
    entry: undefined,
  }));
  const callbackRef = useRef(onChange);
  const frozen = Boolean(state.entry?.isIntersecting && freezeOnceVisible);
  const thresholdKey = Array.isArray(threshold)
    ? threshold.join(',')
    : String(threshold);

  callbackRef.current = onChange;

  useEffect(() => {
    if (
      !ref ||
      typeof window === 'undefined' ||
      !('IntersectionObserver' in window) ||
      frozen
    ) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        entries.forEach((entry) => {
          const isIntersecting =
            entry.isIntersecting &&
            observer.thresholds.some(
              (observerThreshold) =>
                entry.intersectionRatio >= observerThreshold,
            );

          setState({ isIntersecting, entry });
          callbackRef.current?.(isIntersecting, entry);
        });
      },
      { threshold, root, rootMargin },
    );

    observer.observe(ref);

    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, thresholdKey, root, rootMargin, frozen]);

  useEffect(() => {
    if (!ref && !freezeOnceVisible && !frozen) {
      setState({ isIntersecting: initialIsIntersecting, entry: undefined });
    }
  }, [ref, freezeOnceVisible, frozen, initialIsIntersecting]);

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
