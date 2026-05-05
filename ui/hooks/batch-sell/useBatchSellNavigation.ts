import { useCallback, useMemo } from 'react';
import { To, useLocation, useNavigate } from 'react-router-dom';
import {
  BATCH_SELL_CONFIRM_ROUTE,
  BATCH_SELL_SELECT_ROUTE,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes';

type BatchSellNavigationState = {
  state: {};
};

export const useBatchSellNavigation = () => {
  const navigate = useNavigate();

  const { pathname, state: maybeLocationState } = useLocation();
  const locationState: BatchSellNavigationState['state'] = useMemo(
    () => maybeLocationState ?? {},
    [maybeLocationState],
  );

  const resetLocationState = useCallback(
    (to: To = { pathname }, stayOnHomePage = false) => {
      navigate(to, {
        state: {
          ...locationState,
          stayOnHomePage,
        },
      });
    },
    [locationState, pathname],
  );

  const navigateToDefaultRoute = useCallback(() => {
    resetLocationState(DEFAULT_ROUTE, true);
  }, []);

  const navigateToBatchSellSelectPage = useCallback(() => {
    navigate({ pathname: BATCH_SELL_SELECT_ROUTE }, { state: locationState });
  }, [locationState]);

  const navigateToBatchSellConfirmPage = useCallback(() => {
    navigate(
      { pathname: BATCH_SELL_CONFIRM_ROUTE },
      { state: { ...locationState } },
    );
  }, [locationState]);

  return {
    resetLocationState,
    navigateToDefaultRoute,
    navigateToBatchSellSelectPage,
    navigateToBatchSellConfirmPage,
  };
};
