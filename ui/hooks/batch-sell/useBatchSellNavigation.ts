import { useCallback, useMemo } from 'react';
import { To, useLocation, useNavigate } from 'react-router-dom';
import { CaipChainId } from '@metamask/utils';
import {
  BATCH_SELL_CONFIRM_ROUTE,
  BATCH_SELL_SELECT_ROUTE,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes';

export type BatchSellNavigationState = {
  selectedNetworkChainId?: CaipChainId | null;
  selectedAssetsId?: string[];
};

export const useBatchSellNavigation = () => {
  const navigate = useNavigate();

  const { pathname, state: maybeLocationState } = useLocation();
  const locationState: BatchSellNavigationState = useMemo(
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
    [locationState, pathname, navigate],
  );

  const navigateToDefaultRoute = useCallback(() => {
    resetLocationState(DEFAULT_ROUTE, true);
  }, [resetLocationState]);

  const navigateToBatchSellSelectPage = useCallback(
    (state?: BatchSellNavigationState) => {
      navigate(
        { pathname: BATCH_SELL_SELECT_ROUTE },
        { state: { ...locationState, ...state } },
      );
    },
    [locationState, navigate],
  );

  const navigateToBatchSellConfirmPage = useCallback(
    (state: BatchSellNavigationState) => {
      navigate(
        { pathname: BATCH_SELL_CONFIRM_ROUTE },
        { state: { ...locationState, ...state } },
      );
    },
    [locationState, navigate],
  );

  return {
    resetLocationState,
    navigateToDefaultRoute,
    navigateToBatchSellSelectPage,
    navigateToBatchSellConfirmPage,
  };
};
