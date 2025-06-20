import React from 'react';
import configureMockStore from 'redux-mock-store';
import {
  BatchTransactionParams,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { act, waitFor } from '@testing-library/react';

import { Hex } from '@metamask/utils';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import {
  decodeTransactionData,
  getTokenStandardAndDetails,
} from '../../../../../../../store/actions';
import {
  TRANSACTION_DECODE_FOUR_BYTE,
  TRANSACTION_DECODE_NESTED,
  TRANSACTION_DECODE_UNISWAP,
} from '../../../../../../../../test/data/confirmations/transaction-decode';
import { Confirmation } from '../../../../../types/confirm';
import * as useDecodedTransactionDataModule from '../../hooks/useDecodedTransactionData';
import {
  DecodedTransactionDataMethod,
  DecodedTransactionDataSource,
} from '../../../../../../../../shared/types/transaction-decode';
import { TransactionData } from './transaction-data';

const DATA_MOCK = '0x123456';
const DATA_2_MOCK = '0xabcdef';
const TO_MOCK = '0x1234';
const TO_2_MOCK = '0x5678';

jest.mock('../../../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../../../store/actions'),
  decodeTransactionData: jest.fn(),
  getTokenStandardAndDetails: jest.fn(),
}));

async function renderTransactionData({
  currentData,
  dataOverride,
  nestedTransactions,
  toOverride,
  nestedTransactionIndex,
}: {
  currentData: string;
  dataOverride?: Hex;
  nestedTransactions?: BatchTransactionParams[];
  toOverride?: Hex;
  nestedTransactionIndex?: number;
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
    <TransactionData
      data={dataOverride}
      to={toOverride}
      nestedTransactionIndex={nestedTransactionIndex}
    />,
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

  it('renders a truncated token id for an NFT with a long token id', async () => {
    jest
      .spyOn(useDecodedTransactionDataModule, 'useDecodedTransactionData')
      .mockReturnValue({
        idle: false,
        pending: false,
        value: {
          data: [
            {
              name: 'safeTransferFrom',
              description: 'See {IERC1155-safeTransferFrom}.',
              params: [
                {
                  name: 'from',
                  type: 'address',
                  value: '0xDc47789de4ceFF0e8Fe9D15D728Af7F17550c164',
                },
                {
                  name: 'to',
                  type: 'address',
                  value: '0x24867Bf3Fd28a01C76652dEe209561A53E1F563A',
                },
                {
                  name: 'id',
                  type: 'uint256',
                  value:
                    '47089694566375617016335405007688653314974960512522647149273695300528435250823',
                },
                {
                  name: 'amount',
                  type: 'uint256',
                  value: '1',
                },
                {
                  name: 'data',
                  type: 'bytes',
                  value: '0x00',
                },
              ],
            },
          ],
          source: 'sourcify' as DecodedTransactionDataSource.Sourcify,
        },
        error: undefined,
        status: 'success',
      });
    decodeTransactionDataMock.mockResolvedValue(TRANSACTION_DECODE_NESTED);

    const { container } = await renderTransactionData({
      currentData: 'testdata',
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

  it('renders approvals correctly', async () => {
    decodeTransactionDataMock.mockResolvedValue({
      data: [{ name: 'approve' } as DecodedTransactionDataMethod],
      source: '' as DecodedTransactionDataSource,
    });
    (getTokenStandardAndDetails as jest.Mock).mockResolvedValue({
      decimals: 6,
      symbol: 'ETH',
      standard: 'ERC20',
      amountOrTokenId: '10000000',
    });

    const { getByText } = await renderTransactionData({
      currentData: '0x123',
      dataOverride:
        '0x095ea7b30000000000000000000000001231deb6f5749ef6ce6943a275a1d3e7486f4eae000000000000000000000000000000000000000000000000000009184e72a000',
      nestedTransactions: [
        {
          data: '0x095ea7b30000000000000000000000001231deb6f5749ef6ce6943a275a1d3e7486f4eae000000000000000000000000000000000000000000000000000009184e72a000',
          to: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        },
      ],
      nestedTransactionIndex: 0,
    });

    await waitFor(() => {
      expect(getByText('approve')).toBeInTheDocument();
      expect(getByText('Spender')).toBeInTheDocument();
      expect(getByText('Amount')).toBeInTheDocument();
      expect(getByText('10000000 ETH')).toBeInTheDocument();
    });
  });
});
