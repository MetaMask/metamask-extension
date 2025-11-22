import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom-v5-compat';

import {
  SEND_ROUTE,
  PREVIOUS_ROUTE,
} from '../../../../helpers/constants/routes';
import { SendPages } from '../../constants/send';

export const useNavigateSendPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const goToAmountRecipientPage = useCallback(() => {
    navigate(
      `${SEND_ROUTE}/${SendPages.AMOUNTRECIPIENT}?${searchParams.toString()}`,
    );
  }, [searchParams, navigate]);

  const goToPreviousPage = useCallback(() => {
    navigate(PREVIOUS_ROUTE);
  }, [navigate]);

  return { goToAmountRecipientPage, goToPreviousPage };
};
