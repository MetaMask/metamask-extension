import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';
import { useSearchParams } from 'react-router-dom-v5-compat';

import { SEND_ROUTE } from '../../../../helpers/constants/routes';
import { SendPages } from '../../constants/send';

export const useNavigateSendPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const goToAmountRecipientPage = useCallback(() => {
    navigate({
      pathname: `${SEND_ROUTE}/${SendPages.AMOUNTRECIPIENT}`,
      search: searchParams.toString(),
    });
  }, [searchParams, navigate]);

  const goToPreviousPage = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return { goToAmountRecipientPage, goToPreviousPage };
};
