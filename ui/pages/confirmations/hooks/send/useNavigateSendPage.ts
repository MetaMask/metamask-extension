import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
  DEFAULT_ROUTE,
  SEND_ROUTE,
} from '../../../../helpers/constants/routes';
import { useInAppBack } from '../../../../hooks/use-in-app-back';
import { SendPages } from '../../constants/send';

export const useNavigateSendPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const goToPreviousPage = useInAppBack(DEFAULT_ROUTE);

  const goToAmountRecipientPage = useCallback(() => {
    navigate(
      `${SEND_ROUTE}/${SendPages.AMOUNTRECIPIENT}?${searchParams.toString()}`,
    );
  }, [searchParams, navigate]);

  return { goToAmountRecipientPage, goToPreviousPage };
};
