import { act } from 'react-dom/test-utils';
import {
  TransactionParams,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';

import {
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

async function runHook(state: Record<string, unknown>) {
  const response = renderHookWithConfirmContextProvider(
    useDecodedTransactionData,
    state,
  );

  await act(() => {
    // Ignore
  });

  return response.result.current;
}

describe('useDecodedTransactionData', () => {
  const decodeTransactionDataMock = jest.mocked(decodeTransactionData);

  it('returns undefined if no transaction data', async () => {
    const result = await runHook(
      getMockConfirmStateForTransaction({
        id: '123',
        chainId: CHAIN_ID_MOCK,
        type: TransactionType.contractInteraction,
        status: TransactionStatus.unapproved,
        txParams: {
          data: '',
          to: CONTRACT_ADDRESS_MOCK,
        } as TransactionParams,
      }),
    );

    expect(result).toStrictEqual({ pending: false, value: undefined });
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

    expect(result).toMatchInlineSnapshot(`
      {
        "pending": false,
        "value": {
          "data": [
            {
              "description": "Attempt to cancel an authorization",
              "name": "cancelAuthorization",
              "params": [
                {
                  "children": undefined,
                  "description": "Authorizer's address",
                  "name": "authorizer",
                  "type": "address",
                  "value": "0xB0dA5965D43369968574D399dBe6374683773a65",
                },
                {
                  "children": undefined,
                  "description": "Nonce of the authorization",
                  "name": "nonce",
                  "type": "bytes32",
                  "value": "0x0000000000000000000000000000000000000000000000000000000000000123",
                },
                {
                  "children": undefined,
                  "description": "Signature bytes signed by an EOA wallet or a contract wallet",
                  "name": "signature",
                  "type": "bytes",
                  "value": "0x0456",
                },
              ],
            },
          ],
          "source": "Sourcify",
        },
      }
    `);
  });
});
