import React from 'react';
import configureMockStore from 'redux-mock-store';
import {
  BatchTransactionParams,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { act } from '@testing-library/react';

import { Hex } from '@metamask/utils';
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
const DATA_2_MOCK = '0xabcdef';
const TO_MOCK = '0x1234';
const TO_2_MOCK = '0x5678';

jest.mock('../../../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../../../store/actions'),
  decodeTransactionData: jest.fn(),
}));

async function renderTransactionData({
  currentData,
  dataOverride,
  nestedTransactions,
  toOverride,
}: {
  currentData: string;
  dataOverride?: Hex;
  nestedTransactions?: BatchTransactionParams[];
  toOverride?: Hex;
}) {
  const state = getMockConfirmStateForTransaction({
    id: '123',
    chainId: '0x5',
    type: TransactionType.contractInteraction,
    status: TransactionStatus.unapproved,
    nestedTransactions,
    txParams: {
      to: TO_MOCK,
      data: currentData,
    },
  } as Confirmation);

  const mockStore = configureMockStore()(state);

  const result = renderWithConfirmContextProvider(
    <TransactionData data={dataOverride} to={toOverride} />,
    mockStore,
  );

  await act(() => {
    // Ignore
  });

  return result;
}

describe('TransactionData', () => {
  const decodeTransactionDataMock = jest.mocked(decodeTransactionData);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders nothing if no transaction data', async () => {
    decodeTransactionDataMock.mockResolvedValue(undefined);

    const { container } = await renderTransactionData({
      currentData: '',
    });

    expect(container).toMatchSnapshot();
  });

  it('renders raw hexadecimal if no decoded data', async () => {
    decodeTransactionDataMock.mockResolvedValue(undefined);

    const { container } = await renderTransactionData({
      currentData: DATA_MOCK,
    });

    expect(container).toMatchSnapshot();
  });

  it('renders decoded data with no names', async () => {
    decodeTransactionDataMock.mockResolvedValue(TRANSACTION_DECODE_FOUR_BYTE);

    const { container } = await renderTransactionData({
      currentData: DATA_MOCK,
    });

    expect(container).toMatchSnapshot();
  });

  it('renders decoded data with names and descriptions', async () => {
    decodeTransactionDataMock.mockResolvedValue(TRANSACTION_DECODE_UNISWAP);

    const { container } = await renderTransactionData({
      currentData: DATA_MOCK,
    });

    expect(container).toMatchSnapshot();
  });

  it('renders decoded data with tuples and arrays', async () => {
    decodeTransactionDataMock.mockResolvedValue(TRANSACTION_DECODE_NESTED);

    const { container } = await renderTransactionData({
      currentData: DATA_MOCK,
    });

    expect(container).toMatchSnapshot();
  });

  it('renders nothing if nested transactions and no data override', async () => {
    decodeTransactionDataMock.mockResolvedValue(undefined);

    const { container } = await renderTransactionData({
      currentData: DATA_MOCK,
      nestedTransactions: [{}],
    });

    expect(container).toBeEmptyDOMElement();
  });

  it('uses data and to overrides if provided', async () => {
    decodeTransactionDataMock.mockResolvedValue(undefined);

    const { getByText } = await renderTransactionData({
      currentData: DATA_MOCK,
      dataOverride: DATA_2_MOCK,
      toOverride: TO_2_MOCK,
    });

    expect(getByText(DATA_2_MOCK)).toBeInTheDocument();

    expect(decodeTransactionDataMock).toHaveBeenCalledWith(
      expect.objectContaining({
        contractAddress: TO_2_MOCK,
        transactionData: DATA_2_MOCK,
      }),
    );
  });
});
