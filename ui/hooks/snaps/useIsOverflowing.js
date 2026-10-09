import { useState, useEffect, useRef } from 'react';

const measureOverflow = (element) =>
  element.offsetHeight < element.scrollHeight;

const useIsOverflowing = () => {
  const contentRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const element = contentRef.current;

    if (!element) {
      return undefined;
    }

    const updateOverflow = () => {
      setIsOverflowing(measureOverflow(element));
    };

    updateOverflow();

    // contentRef is a stable object, so this effect cannot depend on size.
    // Watch the element, or the window when ResizeObserver is unavailable, so
    // a narrower layout can reveal clipped text after the first measurement.
    const ResizeObserverImpl = globalThis.ResizeObserver;

    if (typeof ResizeObserverImpl !== 'function') {
      window.addEventListener('resize', updateOverflow);
      return () => {
        window.removeEventListener('resize', updateOverflow);
      };
    }

    const observer = new ResizeObserverImpl(updateOverflow);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [contentRef]);

  return { contentRef, isOverflowing };
};

export default useIsOverflowing;
