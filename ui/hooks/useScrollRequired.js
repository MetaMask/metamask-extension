import { useCallback, useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';
import { useSyncEqualityCheck } from './useSyncEqualityCheck';

/**
 * Utility hook for requiring users to scroll through content.
 * Returns an object containing state and helpers to accomplish this.
 *
 * The hook expects both the `ref` and the `onScroll` handler to be passed to the scrolling element.
 *
 * @param dependencies - Any optional hook dependencies for updating the scroll state.
 * @param opt
 * @param {number} opt.offsetPxFromBottom
 * @returns Flags for isScrollable and isScrollToBottom, a ref to use for the scrolling content, a scrollToBottom function and a onScroll handler.
 */
export const useScrollRequired = (
  dependencies = [],
  { offsetPxFromBottom = 16 } = {},
) => {
  const [scrollElement, setScrollElement] = useState(null);
  const offsetHeight = scrollElement?.offsetHeight;
  const dependencySnapshot = useSyncEqualityCheck(dependencies);

  const [hasScrolledToBottomState, setHasScrolledToBottom] = useState(false);
  const [isScrollableState, setIsScrollable] = useState(false);
  const [isScrolledToBottomState, setIsScrolledToBottom] = useState(false);

  const update = useCallback(
    (element = scrollElement) => {
      if (!element) {
        return;
      }

      const isScrollable = element.scrollHeight > element.clientHeight;

      const isScrolledToBottom =
        isScrollable &&
        // Add 16px to the actual scroll position to trigger setIsScrolledToBottom sooner.
        // This avoids the problem where a user has scrolled down to the bottom and it's not detected.
        Math.round(element.scrollTop) +
          element.offsetHeight +
          offsetPxFromBottom >=
          element.scrollHeight;

      if (isScrollable !== isScrollableState) {
        setHasScrolledToBottom(false);
        setIsScrollable(isScrollable);
      }

      const nextIsScrolledToBottom = !isScrollable || isScrolledToBottom;
      if (nextIsScrolledToBottom !== isScrolledToBottomState) {
        setIsScrolledToBottom(nextIsScrolledToBottom);
      }

      if (!isScrollable || isScrolledToBottom) {
        setHasScrolledToBottom(true);
      }
    },
    [
      isScrollableState,
      isScrolledToBottomState,
      offsetPxFromBottom,
      scrollElement,
    ],
  );

  const updateRef = useRef(update);

  useEffect(() => {
    updateRef.current = update;
  }, [update]);

  const setRef = useCallback((node) => {
    setScrollElement((previous) =>
      Object.is(previous, node) ? previous : node,
    );
    if (node) {
      updateRef.current(node);
    }
  }, []);

  const debouncedUpdateRef = useRef(null);
  if (debouncedUpdateRef.current === null) {
    debouncedUpdateRef.current = debounce(() => {
      updateRef.current();
    }, 25);
  }
  const onScroll = debouncedUpdateRef.current;

  useEffect(() => {
    if (!scrollElement) {
      return;
    }
    update(scrollElement);
  }, [scrollElement, dependencySnapshot, update]);

  useEffect(() => {
    if (!scrollElement) {
      return;
    }
    update(scrollElement);
  }, [offsetHeight, scrollElement, update]);

  const scrollToBottom = useCallback(() => {
    setIsScrolledToBottom(true);
    setHasScrolledToBottom(true);

    if (scrollElement) {
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [scrollElement]);

  useEffect(
    () => () => {
      debouncedUpdateRef.current?.cancel();
    },
    [],
  );

  return {
    isScrollable: isScrollableState,
    isScrolledToBottom: isScrolledToBottomState,
    hasScrolledToBottom: hasScrolledToBottomState,
    scrollToBottom,
    setHasScrolledToBottom,
    ref: setRef,
    scrollElement,
    onScroll,
  };
};
