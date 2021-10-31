import React from 'react';
import { store } from '../../../.storybook/preview';
import ConfirmTokenTransactionBase from './confirm-token-transaction-base.component';

export default {
  title: 'Pages/Confirm Token Transaction Base',
  id: __filename,
};

const state = store.getState();

export const Base = () => {
  const { metamask, confirmTransaction } = state;
  const { currentCurrency } = metamask;
  const { fiatTransactionTotal } = confirmTransaction;
  return (
    <ConfirmTokenTransactionBase
      currentCurrency={currentCurrency}
      fiatTransactionTotal={fiatTransactionTotal}
      tokenSymbol="DAI"
    />
  );
};
