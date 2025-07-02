import { act } from 'react-dom/test-utils';
import {
  TransactionParams,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';

import { Hex } from '@metamask/utils';
import {
  TRANSACTION_DATA_FOUR_BYTE,
  TRANSACTION_DATA_UNISWAP,
  TRANSACTION_DECODE_SOURCIFY,
} from '../../../../../../../test/data/confirmations/transaction-decode';
import { decodeTransactionData } from '../../../../../../store/actions';
import { getMockConfirmStateForTransaction } from '../../../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import { useDecodedTransactionData } from './useDecodedTransactionData';

jest.mock('../../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../../store/actions'),
  decodeTransactionData: jest.fn(),
}));

const CONTRACT_ADDRESS_MOCK = '0x123';
const CHAIN_ID_MOCK = '0x5';

async function runHook(
  state: Record<string, unknown>,
  { data, to }: { data?: Hex; to?: Hex } = {},
) {
  const response = renderHookWithConfirmContextProvider(
    () => useDecodedTransactionData({ data, to }),
    state,
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
      const result = await runHook(
        getMockConfirmStateForTransaction({
          id: '123',
          chainId: CHAIN_ID_MOCK,
          type: TransactionType.contractInteraction,
          status: TransactionStatus.unapproved,
          txParams: {
            data,
            to: CONTRACT_ADDRESS_MOCK,
          } as TransactionParams,
        }),
      );

      expect(result).toEqual(
        expect.objectContaining({
          pending: false,
          value: undefined,
        }),
      );
    },
  );

  it('returns undefined if no transaction to', async () => {
    const result = await runHook(
      getMockConfirmStateForTransaction({
        id: '123',
        chainId: CHAIN_ID_MOCK,
        type: TransactionType.contractInteraction,
        status: TransactionStatus.unapproved,
        txParams: {
          data: TRANSACTION_DATA_UNISWAP,
          to: undefined,
        } as TransactionParams,
      }),
    );

    expect(result).toEqual(
      expect.objectContaining({
        pending: false,
        value: undefined,
      }),
    );
  });

  it('returns undefined if decode disabled', async () => {
    decodeTransactionDataMock.mockResolvedValue(TRANSACTION_DECODE_SOURCIFY);

    const result = await runHook(
      getMockConfirmStateForTransaction(
        {
          id: '123',
          chainId: CHAIN_ID_MOCK,
          type: TransactionType.contractInteraction,
          status: TransactionStatus.unapproved,
          txParams: {
            data: TRANSACTION_DATA_UNISWAP,
            to: CONTRACT_ADDRESS_MOCK,
          } as TransactionParams,
        },
        {
          metamask: {
            use4ByteResolution: false,
          },
        },
      ),
    );

    expect(result).toEqual(
      expect.objectContaining({
        pending: false,
        value: undefined,
      }),
    );
  });

  it('returns the decoded data', async () => {
    decodeTransactionDataMock.mockResolvedValue(TRANSACTION_DECODE_SOURCIFY);

    const result = await runHook(
      getMockConfirmStateForTransaction({
        id: '123',
        chainId: CHAIN_ID_MOCK,
        type: TransactionType.contractInteraction,
        status: TransactionStatus.unapproved,
        txParams: {
          data: TRANSACTION_DATA_UNISWAP,
          to: CONTRACT_ADDRESS_MOCK,
        } as TransactionParams,
      }),
    );

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

  it('decodes data using data and to overrides', async () => {
    decodeTransactionDataMock.mockResolvedValue(TRANSACTION_DECODE_SOURCIFY);

    await runHook(
      getMockConfirmStateForTransaction({
        id: '123',
        chainId: CHAIN_ID_MOCK,
        type: TransactionType.contractInteraction,
        status: TransactionStatus.unapproved,
        txParams: {
          data: TRANSACTION_DATA_FOUR_BYTE,
          to: '0x1234',
        } as TransactionParams,
      }),
      {
        data: TRANSACTION_DATA_UNISWAP,
        to: CONTRACT_ADDRESS_MOCK,
      },
    );

    expect(decodeTransactionDataMock).toHaveBeenCalledWith({
      chainId: CHAIN_ID_MOCK,
      contractAddress: CONTRACT_ADDRESS_MOCK,
      transactionData: TRANSACTION_DATA_UNISWAP,
    });
  });
});
