import { useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';

export const useScrollRequired = (deps = []) => {
  const ref = useRef();
  const [isScrollableState, setIsScrollable] = useState(false);
  const [isScrolledToBottomState, setIsScrolledToBottom] = useState(false);

  const update = () => {
    const isScrollable =
      ref.current && ref.current.scrollHeight > ref.current.clientHeight;
    const isScrolledToBottom = isScrollable
      ? Math.round(ref.current.scrollTop) + ref.current.offsetHeight >=
        ref.current.scrollHeight
      : true;
    setIsScrollable(isScrollable);
    setIsScrolledToBottom(isScrolledToBottom);
  };

  useEffect(update, [ref, ...deps]);

  const scrollToBottom = () => {
    if (ref.current) {
      ref.current.scrollTo(0, ref.current.scrollHeight);
    }
  };

  return {
    isScrollable: isScrollableState,
    isScrolledToBottom: isScrolledToBottomState,
    scrollToBottom,
    ref,
    onScroll: debounce(update, 25),
  };
};
