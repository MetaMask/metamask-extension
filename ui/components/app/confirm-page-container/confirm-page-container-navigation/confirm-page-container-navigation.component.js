import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  getCurrentChainId,
  getUnapprovedTransactions,
} from '../../../../selectors';
import { transactionMatchesNetwork } from '../../../../../shared/modules/transaction.utils';
import { CONFIRM_TRANSACTION_ROUTE } from '../../../../helpers/constants/routes';
import { clearConfirmTransaction } from '../../../../ducks/confirm-transaction/confirm-transaction.duck';
import { hexToDecimal } from '../../../../../shared/modules/conversion.utils';
import Navigation from '../../navigation';

const ConfirmPageContainerNavigation = () => {
  const dispatch = useDispatch();
  const history = useHistory();

  const unapprovedTxs = useSelector(getUnapprovedTransactions);
  const currentChainId = useSelector(getCurrentChainId);
  const network = hexToDecimal(currentChainId);

  const currentNetworkUnapprovedTxs = Object.keys(unapprovedTxs)
    .filter((key) =>
      transactionMatchesNetwork(unapprovedTxs[key], currentChainId, network),
    )
    .reduce((acc, key) => ({ ...acc, [key]: unapprovedTxs[key] }), {});

  const enumUnapprovedTxs = Object.keys(currentNetworkUnapprovedTxs);

  const onNextTx = (txId) => {
    if (txId) {
      dispatch(clearConfirmTransaction());
      history.push(`${CONFIRM_TRANSACTION_ROUTE}/${txId}`);
    }
  };

  return (
    <Navigation
      enumUnapprovedTxsOrUnconfirmedMessages={enumUnapprovedTxs}
      onNext={onNextTx}
    />
  );
};

export default ConfirmPageContainerNavigation;
