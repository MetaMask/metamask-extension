import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';
import { useSelector } from 'react-redux';

import { getMostRecentOverviewPage } from '../../../ducks/history/history';

/**
 * useRouting - hook for re-uable reoting related code.
 */

export function useRouting() {
  const navigate = useNavigate();
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);

  const navigateToMostRecentOverviewPage = useCallback(() => {
    navigate(mostRecentOverviewPage);
  }, [navigate, mostRecentOverviewPage]);
  return { navigateToMostRecentOverviewPage };
}
