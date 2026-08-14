import React from 'react';
import { TransactionType } from '@metamask/transaction-controller';

import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import {
  getMockConfirmStateForTransaction,
  getMockPersonalSignConfirmState,
} from '../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import configureStore from '../../../../../store/store';
import { PAY_TRANSACTION_TYPES } from '../../../constants/pay';
import PluggableSection from './pluggable-section';

const render = () => {
  const store = configureStore(getMockPersonalSignConfirmState());
  return renderWithConfirmContextProvider(<PluggableSection />, store);
};

const renderWithTransaction = (type: TransactionType) => {
  const confirmation = {
    ...genUnapprovedContractInteractionConfirmation({ chainId: '0x1' }),
    type,
  };
  const state = getMockConfirmStateForTransaction(confirmation);
  const store = configureStore(state);
  return renderWithConfirmContextProvider(<PluggableSection />, store);
};

describe('PluggableSection', () => {
  it('renders without throwing', () => {
    expect(() => render()).not.toThrow();
  });

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each(PAY_TRANSACTION_TYPES)(
    'returns null for pay transaction type: %s',
    (transactionType: TransactionType) => {
      const { container } = renderWithTransaction(transactionType);
      expect(container).toBeEmptyDOMElement();
    },
  );
});
