import React from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import ConfirmTransactionBase from '../confirm-transaction-base';

import { SEND_ROUTE } from '../../helpers/constants/routes';
import { editExistingTransaction } from '../../ducks/send';

import { clearConfirmTransaction } from '../../ducks/confirm-transaction/confirm-transaction.duck';
import { ASSET_TYPES } from '../../../shared/constants/transaction';

export default function ConfirmContractInteraction() {
  const dispatch = useDispatch();
  const history = useHistory();

  const handleEditTransaction = async ({ txData }) => {
    const { id } = txData;
    await dispatch(editExistingTransaction(ASSET_TYPES.NATIVE, id.toString()));
    dispatch(clearConfirmTransaction());
  };

  const handleEdit = (confirmTransactionData) => {
    handleEditTransaction(confirmTransactionData).then(() => {
      history.push(SEND_ROUTE);
    });
  };

  return (
    <ConfirmTransactionBase
      actionKey="confirm"
      onEdit={(confirmTransactionData) => handleEdit(confirmTransactionData)}
    />
  );
}
