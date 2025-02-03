import { useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';
import { usePrevious } from './usePrevious';

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
  const ref = useRef(null);
  const prevOffsetHeight = usePrevious(ref.current?.offsetHeight);

  const [hasScrolledToBottomState, setHasScrolledToBottom] = useState(false);
  const [isScrollableState, setIsScrollable] = useState(false);
  const [isScrolledToBottomState, setIsScrolledToBottom] = useState(false);

  const update = () => {
    if (!ref.current) {
      return;
    }

    const isScrollable =
      ref.current && ref.current.scrollHeight > ref.current.clientHeight;

    const isScrolledToBottom =
      isScrollable &&
      // Add 16px to the actual scroll position to trigger setIsScrolledToBottom sooner.
      // This avoids the problem where a user has scrolled down to the bottom and it's not detected.
      Math.round(ref.current.scrollTop) +
        ref.current.offsetHeight +
        offsetPxFromBottom >=
        ref.current.scrollHeight;

    if (isScrollable !== isScrollableState) {
      setHasScrolledToBottom(false);
      setIsScrollable(isScrollable);
    }

    setIsScrolledToBottom(!isScrollable || isScrolledToBottom);

    if (!isScrollable || isScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  useEffect(update, [ref, ...dependencies]);

  useEffect(() => {
    if (prevOffsetHeight !== ref.current?.offsetHeight) {
      update();
    }
  }, [ref.current?.offsetHeight]);

  const scrollToBottom = () => {
    setIsScrolledToBottom(true);
    setHasScrolledToBottom(true);

    if (ref.current) {
      ref.current.scrollTo({
        top: ref.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  return {
    isScrollable: isScrollableState,
    isScrolledToBottom: isScrolledToBottomState,
    hasScrolledToBottom: hasScrolledToBottomState,
    scrollToBottom,
    setHasScrolledToBottom,
    ref,
    onScroll: debounce(update, 25),
  };
};
