import React from 'react';
import { TransactionType } from '@metamask/transaction-controller';

import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';

import configureStore from '../../../../store/store';
import ConfirmTitle from './confirm-title';

describe('ConfirmTitle', () => {
  const store = configureStore(mockState);

  it('should render title correctly', async () => {
    const { findByText } = renderWithProvider(
      <ConfirmTitle
        txData={{
          txParams: {},
        }}
        hexTransactionAmount="0x9184e72a000"
      />,
      store,
    );
    expect(await findByText('0.00001')).toBeInTheDocument();
  });

  it('should return null if transaction is contract interation with 0 value', () => {
    const { container } = renderWithProvider(
      <ConfirmTitle
        txData={{
          txParams: {
            value: '0x0',
          },
          type: TransactionType.contractInteraction,
        }}
      />,
      store,
    );
    expect(container.firstChild).toStrictEqual(null);
  });

  it('should render title if passed', () => {
    const { getByText } = renderWithProvider(
      <ConfirmTitle
        txData={{
          txParams: {},
        }}
        hexTransactionAmount="0x5"
        title="dummy_title_passed"
      />,
      store,
    );
    expect(getByText('dummy_title_passed')).toBeInTheDocument();
  });
});
