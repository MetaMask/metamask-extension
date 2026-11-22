import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BATCH_SELL_REVIEW_ROUTE,
  BATCH_SELL_SELECT_ROUTE,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes';

export const useBatchSellNavigation = () => {
  const navigate = useNavigate();

  const navigateToDefaultRoute = useCallback(() => {
    navigate(DEFAULT_ROUTE);
  }, [navigate]);

  const navigateToBatchSellSelectPage = useCallback(() => {
    navigate({ pathname: BATCH_SELL_SELECT_ROUTE });
  }, [navigate]);

  const navigateToBatchSellConfirmPage = useCallback(() => {
    navigate({ pathname: BATCH_SELL_REVIEW_ROUTE });
  }, [navigate]);

  return {
    navigateToDefaultRoute,
    navigateToBatchSellSelectPage,
    navigateToBatchSellConfirmPage,
  };
};
