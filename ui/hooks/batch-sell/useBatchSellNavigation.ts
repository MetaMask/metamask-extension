import { useCallback } from 'react';
import { To, useLocation, useNavigate } from 'react-router-dom';
import {
  BATCH_SELL_REVIEW_ROUTE,
  BATCH_SELL_SELECT_ROUTE,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes';

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

  const navigateToBatchSellSelectPage = useCallback(() => {
    navigate({ pathname: BATCH_SELL_SELECT_ROUTE });
  }, [navigate]);

  const navigateToBatchSellConfirmPage = useCallback(() => {
    navigate({ pathname: BATCH_SELL_REVIEW_ROUTE });
  }, [navigate]);

  return {
    resetLocationState,
    navigateToDefaultRoute,
    navigateToBatchSellSelectPage,
    navigateToBatchSellConfirmPage,
  };
};
