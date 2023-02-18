import React from 'react';

import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/jest';

import configureStore from '../../../store/store';
import ConfirmTransactionData from '.';

jest.mock('../../../../shared/lib/fetch-with-cache');

describe('ConfirmTransactionData', () => {
  const store = configureStore(mockState);

  it('should render function type', async () => {
    const { findByText } = renderWithProvider(
      <ConfirmTransactionData
        txData={{
          txParams: {
            data: '0x608060405234801',
          },
          origin: 'https://metamask.github.io',
          type: 'transfer',
        }}
      />,
      store,
    );
    expect(await findByText('Transfer')).toBeInTheDocument();
  });

  it('should return null if transaction has no data', async () => {
    const { container } = renderWithProvider(
      <ConfirmTransactionData
        txData={{
          txParams: {},
          origin: 'https://metamask.github.io',
          type: 'transfer',
        }}
      />,
      store,
    );
    expect(container.firstChild).toEqual(null);
  });

  it('should render dataComponent if passed', async () => {
    const { getByText } = renderWithProvider(
      <ConfirmTransactionData
        txData={{
          txParams: {},
          origin: 'https://metamask.github.io',
          type: 'transfer',
        }}
        dataComponent={<span>Data Component</span>}
      />,
      store,
    );
    expect(getByText('Data Component')).toBeInTheDocument();
  });
});
