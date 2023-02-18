import React from 'react';

import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/jest';

import configureStore from '../../../store/store';
import ConfirmTransactionHexData from '.';

jest.mock('../../../../shared/lib/fetch-with-cache');

describe('ConfirmTransactionData', () => {
  const store = configureStore(mockState);

  it('should render function type', async () => {
    const { findByText } = renderWithProvider(
      <ConfirmTransactionHexData
        txData={{
          txParams: {
            to: '0x8eeee1781fd885ff5ddef7789486676961873d12',
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
      <ConfirmTransactionHexData
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
    expect(container.firstChild).toEqual(null);
  });

  it('should return null if transaction has no to address', async () => {
    const { container } = renderWithProvider(
      <ConfirmTransactionHexData
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
    expect(container.firstChild).toEqual(null);
  });

  it('should render dataHexComponent if passed', async () => {
    const { getByText } = renderWithProvider(
      <ConfirmTransactionHexData
        txData={{
          txParams: {},
          origin: 'https://metamask.github.io',
          type: 'transfer',
        }}
        dataHexComponent={<span>Data Hex Component</span>}
      />,
      store,
    );
    expect(getByText('Data Hex Component')).toBeInTheDocument();
  });
});
