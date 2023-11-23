import { useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

import {
  CONFIRM_TRANSACTION_ROUTE,
  SIGNATURE_REQUEST_PATH,
} from '../../helpers/constants/routes';
import { currentConfirmationSelector } from '../../selectors/confirm';

const syncConfirmPath = () => {
  const history = useHistory();
  const { id: paramsTransactionId } = useParams<{ id: string }>();

  const currentConfirmation = useSelector(currentConfirmationSelector);

  // Redirect below is done to keep the confirmation routes backward compatible
  // Currently we have only signature request,
  // but it will include other confirmation types in future
  useEffect(() => {
    if (!currentConfirmation) {
      return;
    }
    if (paramsTransactionId !== currentConfirmation.id) {
      history.replace(
        `${CONFIRM_TRANSACTION_ROUTE}/${currentConfirmation.id}/${SIGNATURE_REQUEST_PATH}`,
      );
    }
  }, [currentConfirmation, paramsTransactionId]);
};

export default syncConfirmPath;
