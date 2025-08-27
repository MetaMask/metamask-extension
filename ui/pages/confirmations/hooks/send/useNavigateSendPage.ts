import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import { SEND_ROUTE } from '../../../../helpers/constants/routes';
import { SendPages } from '../../constants/send';

export const useNavigateSendPage = () => {
  const history = useHistory();

  const goToAmountPage = useCallback(() => {
    history.push(`${SEND_ROUTE}/${SendPages.AMOUNT}`);
  }, [history]);

  const goToSendToPage = useCallback(() => {
    history.push(`${SEND_ROUTE}/${SendPages.RECIPIENT}`);
  }, [history]);

  const goToPreviousPage = useCallback(() => {
    history.goBack();
  }, [history]);

  return { goToAmountPage, goToPreviousPage, goToSendToPage };
};
