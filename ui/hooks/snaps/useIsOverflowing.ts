import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

type UseIsOverflowingReturn = {
  contentRef: RefObject<HTMLElement | null>;
  isOverflowing: boolean;
};

const useIsOverflowing = (): UseIsOverflowingReturn => {
  const contentRef = useRef<HTMLElement | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const element = contentRef.current;

    setIsOverflowing(
      Boolean(element && element.offsetHeight < element.scrollHeight),
    );
  }, [contentRef]);

  return { contentRef, isOverflowing };
};

export default useIsOverflowing;
