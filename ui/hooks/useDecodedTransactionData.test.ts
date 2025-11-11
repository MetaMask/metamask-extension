import { act } from 'react-dom/test-utils';
import {
  TransactionParams,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';

import { Hex } from '@metamask/utils';
import { renderHook } from '@testing-library/react-hooks';
import { renderHookWithProvider } from '../../test/lib/render-helpers';
import { decodeTransactionData } from '../store/actions';
import {
  TRANSACTION_DATA_UNISWAP,
  TRANSACTION_DECODE_SOURCIFY,
} from '../../test/data/confirmations/transaction-decode';
import { DecodedTransactionDataSource } from '../../shared/types';
import {
  useDecodedTransactionData,
  useDecodedTransactionDataValue,
} from './useDecodedTransactionData';

jest.mock('../store/actions', () => ({
  ...jest.requireActual('../store/actions'),
  decodeTransactionData: jest.fn(),
}));

const CONTRACT_ADDRESS_MOCK = '0x123';
const CHAIN_ID_MOCK = '0x5';

async function runHook({
  data,
  to,
  chainId,
}: { data?: Hex; to?: Hex; chainId?: Hex } = {}) {
  const response = renderHook(() =>
    useDecodedTransactionData({ data, to, chainId }),
  );

  await act(() => {
    // Ignore
  });

  return response.result.current;
}

describe('useDecodedTransactionData', () => {
  const decodeTransactionDataMock = jest.mocked(decodeTransactionData);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([undefined, null, '', '0x', '0X'])(
    'returns undefined if transaction data is %s',
    async (data: string | null | undefined) => {
      const result = await runHook({
        chainId: CHAIN_ID_MOCK,
        data: data as Hex,
        to: CONTRACT_ADDRESS_MOCK,
      });

      expect(result).toEqual(
        expect.objectContaining({
          pending: false,
          value: undefined,
        }),
      );
    },
  );

  it('returns undefined if no transaction to', async () => {
    const result = await runHook({
      chainId: CHAIN_ID_MOCK,
      data: TRANSACTION_DATA_UNISWAP,
      to: undefined,
    });

    expect(result).toEqual(
      expect.objectContaining({
        pending: false,
        value: undefined,
      }),
    );
  });

  it('returns the decoded data', async () => {
    decodeTransactionDataMock.mockResolvedValue(TRANSACTION_DECODE_SOURCIFY);

    const result = await runHook({
      data: TRANSACTION_DATA_UNISWAP,
      to: CONTRACT_ADDRESS_MOCK,
      chainId: CHAIN_ID_MOCK,
    });

    expect(result).toEqual(
      expect.objectContaining({
        pending: false,
        value: expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              name: 'cancelAuthorization',
              description: 'Attempt to cancel an authorization',
              params: expect.arrayContaining([
                expect.objectContaining({
                  name: 'authorizer',
                  type: 'address',
                  value: '0xB0dA5965D43369968574D399dBe6374683773a65',
                }),
                expect.objectContaining({
                  name: 'nonce',
                  type: 'bytes32',
                  value:
                    '0x0000000000000000000000000000000000000000000000000000000000000123',
                }),
                expect.objectContaining({
                  name: 'signature',
                  type: 'bytes',
                  value: '0x0456',
                }),
              ]),
            }),
          ]),
          source: 'Sourcify',
        }),
      }),
    );
  });
});

describe('useDecodedTransactionDataValue', () => {
  const decodeTransactionDataMock = jest.mocked(decodeTransactionData);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns undefined value when no transactionMeta provided', async () => {
    const { result } = renderHookWithProvider(
      () => useDecodedTransactionDataValue(),
      {
        data: TRANSACTION_DATA_UNISWAP,
        to: CONTRACT_ADDRESS_MOCK,
        chainId: CHAIN_ID_MOCK,
      },
    );

    await act(() => {
      // Ignore
    });

    expect(result.current).toEqual({
      decodeResponse: expect.objectContaining({
        pending: false,
        value: undefined,
      }),
      value: undefined,
    });
  });

  it('returns undefined value when no param with name "value" found', async () => {
    const mockDecodeResponse = {
      data: [
        {
          name: 'someFunction',
          params: [
            { name: 'param1', type: 'address', value: '0x123' },
            { name: 'param2', type: 'uint256', value: '100' },
          ],
        },
      ],
      source: DecodedTransactionDataSource.Sourcify,
    };

    decodeTransactionDataMock.mockResolvedValue(mockDecodeResponse);

    const transactionMeta = {
      id: '123',
      chainId: CHAIN_ID_MOCK as Hex,
      type: TransactionType.contractInteraction,
      status: TransactionStatus.unapproved,
      networkClientId: 'mainnet',
      time: Date.now(),
      txParams: {
        data: TRANSACTION_DATA_UNISWAP,
        to: CONTRACT_ADDRESS_MOCK,
      } as TransactionParams,
    };

    const { result } = renderHook(() =>
      useDecodedTransactionDataValue(transactionMeta),
    );

    await act(() => {
      // Ignore
    });

    expect(result.current).toEqual({
      decodeResponse: expect.objectContaining({
        pending: false,
        value: mockDecodeResponse,
      }),
      value: undefined,
    });
  });

  it('returns the value when param with name "value" is found', async () => {
    const mockDecodeResponse = {
      data: [
        {
          name: 'someFunction',
          params: [
            { name: 'param1', type: 'address', value: '0x123' },
            { name: 'value', type: 'uint256', value: '1000' },
            { name: 'param2', type: 'bytes32', value: '0x456' },
          ],
        },
      ],
      source: DecodedTransactionDataSource.Sourcify,
    };

    decodeTransactionDataMock.mockResolvedValue(mockDecodeResponse);

    const transactionMeta = {
      id: '123',
      chainId: CHAIN_ID_MOCK as Hex,
      type: TransactionType.contractInteraction,
      status: TransactionStatus.unapproved,
      networkClientId: 'mainnet',
      time: Date.now(),
      txParams: {
        data: TRANSACTION_DATA_UNISWAP,
        to: CONTRACT_ADDRESS_MOCK,
      } as TransactionParams,
    };

    const { result } = renderHook(() =>
      useDecodedTransactionDataValue(transactionMeta),
    );

    await act(() => {
      // Ignore
    });

    expect(result.current).toEqual({
      decodeResponse: expect.objectContaining({
        pending: false,
        value: mockDecodeResponse,
      }),
      value: '1000',
    });
  });
});
