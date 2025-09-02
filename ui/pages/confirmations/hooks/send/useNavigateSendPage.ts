import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom-v5-compat';

import { SEND_ROUTE } from '../../../../helpers/constants/routes';
import { SendPages } from '../../constants/send';

export const useNavigateSendPage = () => {
  const history = useHistory();
  const [searchParams] = useSearchParams();

  const goToAmountRecipientPage = useCallback(() => {
    history.push(
      `${SEND_ROUTE}/${SendPages.AMOUNTRECIPIENT}?${searchParams.toString()}`,
    );
  }, [searchParams, history]);

  const goToPreviousPage = useCallback(() => {
    history.goBack();
  }, [history]);

  return { goToAmountRecipientPage, goToPreviousPage };
};
