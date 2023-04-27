import React from 'react';

import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/jest';

import configureStore from '../../../store/store';
import ConfirmHexData from './confirm-hexdata';

jest.mock('../../../../shared/lib/fetch-with-cache');

describe('ConfirmHexData', () => {
  const store = configureStore(mockState);

  it('should render function type', async () => {
    const { findByText } = renderWithProvider(
      <ConfirmHexData
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

  it('should return null if transaction has no data', () => {
    const { container } = renderWithProvider(
      <ConfirmHexData
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
    expect(container.firstChild).toStrictEqual(null);
  });

  it('should return null if transaction has no to address', () => {
    const { container } = renderWithProvider(
      <ConfirmHexData
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
    expect(container.firstChild).toStrictEqual(null);
  });

  it('should render dataHexComponent if passed', () => {
    const { getByText } = renderWithProvider(
      <ConfirmHexData
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
