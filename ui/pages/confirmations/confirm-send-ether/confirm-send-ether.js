import React from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { AssetType } from '../../../../shared/constants/transaction';
import { clearConfirmTransaction } from '../../../ducks/confirm-transaction/confirm-transaction.duck';
import { editExistingTransaction } from '../../../ducks/send';
import { SEND_ROUTE } from '../../../helpers/constants/routes';
import ConfirmTransactionBase from '../confirm-transaction-base';

const ConfirmSendEther = () => {
  const dispatch = useDispatch();
  const history = useHistory();

  const editTransaction = async (txData) => {
    const { id } = txData;
    await dispatch(editExistingTransaction(AssetType.native, id.toString()));
    dispatch(clearConfirmTransaction());
  };

  const handleEdit = ({ txData }) => {
    editTransaction(txData).then(() => {
      history.push(SEND_ROUTE);
    });
  };

  return (
    <ConfirmTransactionBase
      actionKey="confirm"
      onEdit={(confirmTransactionData) => handleEdit(confirmTransactionData)}
    />
  );
};

export default ConfirmSendEther;
