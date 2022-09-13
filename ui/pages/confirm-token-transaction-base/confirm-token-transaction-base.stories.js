import React from 'react';
import { store } from '../../../.storybook/preview';
import ConfirmTokenTransactionBase from './confirm-token-transaction-base';

export default {
  title: 'Pages/ConfirmTokenTransactionBase',
  id: __filename,
};

const state = store.getState();

export const DefaultStory = () => {
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

DefaultStory.storyName = 'Default';
