import React from 'react';

import { CHAIN_IDS } from '@metamask/transaction-controller';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/jest';

import configureStore from '../../../../store/store';
import { mockNetworkState } from '../../../../../test/stub/networks';
import ConfirmHexData from './confirm-hexdata';

jest.mock('../../../../../shared/lib/fetch-with-cache');

const CHAIN_ID_MOCK = CHAIN_IDS.GOERLI;

const STATE_MOCK = {
  ...mockState,
  metamask: {
    ...mockState.metamask,
    ...mockNetworkState({ chainId: CHAIN_ID_MOCK }),
  },
};

describe('ConfirmHexData', () => {
  const store = configureStore(STATE_MOCK);

  it('should render function type', async () => {
    const { findByText } = renderWithProvider(
      <ConfirmHexData
        txData={{
          chainId: CHAIN_ID_MOCK,
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

  it.each([undefined, null, '', '0x', '0X'])(
    'should return null if transaction data is %s',
    (data) => {
      const { container } = renderWithProvider(
        <ConfirmHexData
          txData={{
            chainId: CHAIN_ID_MOCK,
            txParams: {
              data,
            },
            origin: 'https://metamask.github.io',
            type: 'transfer',
          }}
        />,
        store,
      );
      expect(container.firstChild).toStrictEqual(null);
    },
  );

  it('should return null if transaction has no to address', () => {
    const { container } = renderWithProvider(
      <ConfirmHexData
        txData={{
          chainId: CHAIN_ID_MOCK,
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
          chainId: CHAIN_ID_MOCK,
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
