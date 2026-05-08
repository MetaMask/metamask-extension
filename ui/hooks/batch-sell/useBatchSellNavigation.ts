import { useCallback } from 'react';
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
  const { pathname } = useLocation();

  const resetLocationState = useCallback(
    (to: To = { pathname }, stayOnHomePage = false) => {
      navigate(to, {
        state: {
          stayOnHomePage,
        },
      });
    },
    [pathname, navigate],
  );

  const navigateToDefaultRoute = useCallback(() => {
    resetLocationState(DEFAULT_ROUTE, true);
  }, [resetLocationState]);

  const navigateToBatchSellSelectPage = useCallback(
    (state?: BatchSellNavigationState) => {
      navigate({ pathname: BATCH_SELL_SELECT_ROUTE }, { state: state ?? {} });
    },
    [navigate],
  );

  const navigateToBatchSellConfirmPage = useCallback(
    (state: BatchSellNavigationState) => {
      navigate({ pathname: BATCH_SELL_CONFIRM_ROUTE }, { state });
    },
    [navigate],
  );

  return {
    resetLocationState,
    navigateToDefaultRoute,
    navigateToBatchSellSelectPage,
    navigateToBatchSellConfirmPage,
  };
};
