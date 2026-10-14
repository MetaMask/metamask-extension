import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useScrollContainer } from '#ui/contexts/scroll-container';

export const ScrollToTop = () => {
  const scrollRef = useScrollContainer();
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    if (scrollRef?.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [pathname, scrollRef]);

  return null;
};
