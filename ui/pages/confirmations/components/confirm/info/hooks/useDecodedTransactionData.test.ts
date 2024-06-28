import { useDecodedTransactionData } from './useDecodedTransactionData';
import {
  TRANSACTION_DATA_UNISWAP,
  TRANSACTION_DECODE_SOURCIFY,
} from '../../../../../../../test/data/confirmations/transaction-decode';
import { decodeTransactionData } from '../../../../../../store/actions';
import { renderHook } from '@testing-library/react-hooks';
import { act } from 'react-dom/test-utils';

jest.mock('../../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../../store/actions'),
  decodeTransactionData: jest.fn(),
}));

const CONTRACT_ADDRESS_MOCK = '0x123';
const CHAIN_ID_MOCK = '0x1';

describe('useDecodedTransactionData', () => {
  const decodeTransactionDataMock = jest.mocked(decodeTransactionData);

  it('returns the decoded data', async () => {
    decodeTransactionDataMock.mockResolvedValue(TRANSACTION_DECODE_SOURCIFY);

    const { result } = renderHook(() =>
      useDecodedTransactionData({
        transactionData: TRANSACTION_DATA_UNISWAP,
        chainId: CHAIN_ID_MOCK,
        contractAddress: CONTRACT_ADDRESS_MOCK,
      }),
    );

    await act(() => {});

    expect(result.current).toMatchInlineSnapshot(`
      {
        "pending": false,
        "value": {
          "data": [
            {
              "description": "Attempt to cancel an authorization",
              "name": "cancelAuthorization",
              "params": [
                {
                  "description": "Authorizer's address",
                  "name": "authorizer",
                  "type": "address",
                  "value": "0xB0dA5965D43369968574D399dBe6374683773a65",
                },
                {
                  "description": "Nonce of the authorization",
                  "name": "nonce",
                  "type": "bytes32",
                  "value": "0x0000000000000000000000000000000000000000000000000000000000000123",
                },
                {
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
