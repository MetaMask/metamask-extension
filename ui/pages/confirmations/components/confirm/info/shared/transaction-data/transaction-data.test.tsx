import React from 'react';
import configureMockStore from 'redux-mock-store';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { act } from '@testing-library/react';

import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { decodeTransactionData } from '../../../../../../../store/actions';
import {
  TRANSACTION_DECODE_FOUR_BYTE,
  TRANSACTION_DECODE_NESTED,
  TRANSACTION_DECODE_UNISWAP,
} from '../../../../../../../../test/data/confirmations/transaction-decode';
import { Confirmation } from '../../../../../types/confirm';
import { TransactionData } from './transaction-data';

const DATA_MOCK = '0x123456';

jest.mock('../../../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../../../store/actions'),
  decodeTransactionData: jest.fn(),
}));

async function renderTransactionData(transactionData: string) {
  const state = getMockConfirmStateForTransaction({
    id: '123',
    chainId: '0x5',
    type: TransactionType.contractInteraction,
    status: TransactionStatus.unapproved,
    txParams: {
      data: transactionData,
    },
  } as Confirmation);

  const mockStore = configureMockStore()(state);
  const { container } = renderWithConfirmContextProvider(
    <TransactionData />,
    mockStore,
  );

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
