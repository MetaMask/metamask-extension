import { useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

import {
  CONFIRM_TRANSACTION_ROUTE,
  SIGNATURE_REQUEST_PATH,
} from '../../../helpers/constants/routes';
import { currentConfirmationSelector } from '../../../selectors/confirm';

const syncConfirmPath = () => {
  const history = useHistory();
  const { id: paramsTransactionId } = useParams<{ id: string }>();

  const currentConfirmation = useSelector(currentConfirmationSelector);

  // Redirect below is done to keep the confirmation routes backward compatible
  useEffect(() => {
    if (!currentConfirmation) {
      return;
    }
    if (paramsTransactionId !== currentConfirmation.id) {
      const isSignature = Boolean(currentConfirmation.msgParams);
      if (isSignature) {
        history.replace(
          `${CONFIRM_TRANSACTION_ROUTE}/${currentConfirmation.id}/${SIGNATURE_REQUEST_PATH}`,
        );
      }
      // todo: logic to replace url for rest of transactions to be added here
    }
  }, [currentConfirmation, paramsTransactionId]);
};

export default syncConfirmPath;
