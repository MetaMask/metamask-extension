import React from 'react';
import configureMockStore from 'redux-mock-store';
import { act } from '@testing-library/react';
import mockState from '../../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../../test/lib/render-helpers';
import { decodeTransactionData } from '../../../../../../../store/actions';
import {
  TRANSACTION_DECODE_FOUR_BYTE,
  TRANSACTION_DECODE_NESTED,
  TRANSACTION_DECODE_UNISWAP,
} from '../../../../../../../../test/data/confirmations/transaction-decode';
import { TransactionData } from './transaction-data';

const DATA_MOCK = '0x123456';

jest.mock('../../../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../../../store/actions'),
  decodeTransactionData: jest.fn(),
}));

async function renderTransactionData(transactionData: string) {
  const state = {
    ...mockState,
    confirm: {
      currentConfirmation: {
        txParams: {
          to: '0x1234',
          data: transactionData,
        },
      },
    },
  };

  const mockStore = configureMockStore()(state);
  const { container } = renderWithProvider(<TransactionData />, mockStore);

  await act(() => {
    // Ignore
  });

  return container;
}

describe('TransactionData', () => {
  const decodeTransactionDataMock = jest.mocked(decodeTransactionData);

  it('renders nothing if no transaction data', async () => {
    decodeTransactionDataMock.mockResolvedValue(undefined);

    const container = await renderTransactionData('');

    expect(container).toMatchSnapshot();
  });

  it('renders raw hexadecimal if no decoded data', async () => {
    decodeTransactionDataMock.mockResolvedValue(undefined);

    const container = await renderTransactionData(DATA_MOCK);

    expect(container).toMatchSnapshot();
  });

  it('renders decoded data with no names', async () => {
    decodeTransactionDataMock.mockResolvedValue(TRANSACTION_DECODE_FOUR_BYTE);

    const container = await renderTransactionData(DATA_MOCK);

    expect(container).toMatchSnapshot();
  });

  it('renders decoded data with names and descriptions', async () => {
    decodeTransactionDataMock.mockResolvedValue(TRANSACTION_DECODE_UNISWAP);

    const container = await renderTransactionData(DATA_MOCK);

    expect(container).toMatchSnapshot();
  });

  it('renders decoded data with tuples and arrays', async () => {
    decodeTransactionDataMock.mockResolvedValue(TRANSACTION_DECODE_NESTED);

    const container = await renderTransactionData(DATA_MOCK);

    expect(container).toMatchSnapshot();
  });
});
