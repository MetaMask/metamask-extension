import { useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import { CONFIRM_TRANSACTION_ROUTE } from '../../../helpers/constants/routes';
import { Confirmation } from '../types/confirm';

const syncConfirmPath = (currentConfirmation?: Confirmation) => {
  const history = useHistory();
  const { id: paramsTransactionId } = useParams<{ id: string }>();

  // Redirect below is done to keep the confirmation routes backward compatible
  useEffect(() => {
    if (!currentConfirmation) {
      return;
    }
    if (!paramsTransactionId) {
      history.replace(`${CONFIRM_TRANSACTION_ROUTE}/${currentConfirmation.id}`);
    }
  }, [currentConfirmation, paramsTransactionId]);
};

export default syncConfirmPath;
