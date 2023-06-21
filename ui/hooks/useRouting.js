import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { getMostRecentOverviewPage } from '../ducks/history/history';

/**
 * useRouting - hook for re-uable reoting related code.
 */

export function useRouting() {
  const history = useHistory();
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);

  const navigateToMostRecentOverviewPage = useCallback(() => {
    history.push(mostRecentOverviewPage);
  }, [history, mostRecentOverviewPage]);
  return { navigateToMostRecentOverviewPage };
}
