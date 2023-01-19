import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { unconfirmedMessagesHashSelector } from '../../../../selectors';
import {
  CONFIRM_TRANSACTION_ROUTE,
  SIGNATURE_REQUEST_PATH,
} from '../../../../helpers/constants/routes';
import { clearConfirmTransaction } from '../../../../ducks/confirm-transaction/confirm-transaction.duck';
import Navigation from '../../navigation';

const SignatureRequestNavigation = () => {
  const dispatch = useDispatch();
  const history = useHistory();

  const unconfirmedMessages = useSelector(unconfirmedMessagesHashSelector);
  const enumUnconfirmedMessages = Object.keys(unconfirmedMessages);

  const onNextMessage = (txId) => {
    if (txId) {
      dispatch(clearConfirmTransaction());
      history.push(
        `${CONFIRM_TRANSACTION_ROUTE}/${txId}${SIGNATURE_REQUEST_PATH}`,
      );
    }
  };

  return (
    <Navigation
      enumUnapprovedTxsOrUnconfirmedMessages={enumUnconfirmedMessages}
      onNext={onNextMessage}
    />
  );
};

export default SignatureRequestNavigation;
