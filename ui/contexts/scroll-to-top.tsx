import { useLayoutEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { useScrollContainer } from '#ui/contexts/scroll-container';

const selectSelectedAccountGroupId = (state: {
  metamask?: { selectedAccountGroup?: string };
}): string | undefined => state.metamask?.selectedAccountGroup;

export const ScrollToTop = () => {
  const scrollRef = useScrollContainer();
  const { pathname } = useLocation();
  // Account switches stay on the same route (#46412), so pathname does not
  // change. The token list is virtualized against this scroller; leaving the
  // previous account's scroll offset in place paints the new rows on top of it.
  const selectedAccountGroup = useSelector(selectSelectedAccountGroupId);

  useLayoutEffect(() => {
    if (scrollRef?.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [pathname, scrollRef, selectedAccountGroup]);

  return null;
};
