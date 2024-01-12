import { useState, useEffect, useRef } from 'react';

const useIsOverflowing = () => {
  const contentRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    setIsOverflowing(
      contentRef.current &&
        contentRef.current.offsetHeight < contentRef.current.scrollHeight,
    );
  }, [contentRef]);

  return { contentRef, isOverflowing };
};

export default useIsOverflowing;
