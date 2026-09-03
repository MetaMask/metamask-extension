import { useCallback, useEffect, useMemo, useState } from 'react';
import { debounce } from 'lodash';

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
  const setRef = useCallback((node) => {
    setScrollElement(node);
  }, []);

  const offsetHeight = scrollElement?.offsetHeight;

  const [hasScrolledToBottomState, setHasScrolledToBottom] = useState(false);
  const [isScrollableState, setIsScrollable] = useState(false);
  const [isScrolledToBottomState, setIsScrolledToBottom] = useState(false);

  const update = useCallback(() => {
    if (!scrollElement) {
      return;
    }

    const isScrollable =
      scrollElement.scrollHeight > scrollElement.clientHeight;

    const isScrolledToBottom =
      isScrollable &&
      // Add 16px to the actual scroll position to trigger setIsScrolledToBottom sooner.
      // This avoids the problem where a user has scrolled down to the bottom and it's not detected.
      Math.round(scrollElement.scrollTop) +
        scrollElement.offsetHeight +
        offsetPxFromBottom >=
        scrollElement.scrollHeight;

    if (isScrollable !== isScrollableState) {
      setHasScrolledToBottom(false);
      setIsScrollable(isScrollable);
    }

    setIsScrolledToBottom(!isScrollable || isScrolledToBottom);

    if (!isScrollable || isScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  }, [isScrollableState, offsetPxFromBottom, scrollElement]);

  useEffect(() => {
    queueMicrotask(() => update());
  }, [update, scrollElement, offsetHeight, ...dependencies]);

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

  const onScroll = useMemo(() => debounce(update, 25), [update]);

  return {
    isScrollable: isScrollableState,
    isScrolledToBottom: isScrolledToBottomState,
    hasScrolledToBottom: hasScrolledToBottomState,
    scrollToBottom,
    setHasScrolledToBottom,
    ref: setRef,
    onScroll,
  };
};
