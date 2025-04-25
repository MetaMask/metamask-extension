import { CHAIN_IDS } from '@metamask/transaction-controller';
import { jsonRpcRequest } from '../../../../shared/modules/rpc.utils';
import {
  RELAY_RPC_METHOD,
  RelaySubmitRequest,
  submitRelayTransaction,
} from './transaction-relay';

jest.mock('../../../../shared/modules/rpc.utils');

const TRANSACTION_HASH_MOCK = '0x123';
const ERROR_BODY_MOCK = 'test error';

const SUBMIT_REQUEST_MOCK: RelaySubmitRequest = {
  chainId: CHAIN_IDS.MAINNET,
  data: '0x1',
  to: '0x4',
};

describe('Transaction Relay Utils', () => {
  const jsonRpcRequestMock = jest.mocked(jsonRpcRequest);

  beforeEach(() => {
    jest.resetAllMocks();

    jsonRpcRequestMock.mockResolvedValue({
      transactionHash: TRANSACTION_HASH_MOCK,
    });
  });

  describe('submitRelayTransaction', () => {
    it('submits request to API', async () => {
      await submitRelayTransaction(SUBMIT_REQUEST_MOCK);

      expect(jsonRpcRequestMock).toHaveBeenCalledWith(
        expect.any(String),
        RELAY_RPC_METHOD,
        [SUBMIT_REQUEST_MOCK],
      );
    });

    it('returns transaction hash from response if successful', async () => {
      const result = await submitRelayTransaction(SUBMIT_REQUEST_MOCK);

      expect(result).toStrictEqual({
        transactionHash: TRANSACTION_HASH_MOCK,
      });
    });

    it('throws if chain not supported', async () => {
      jsonRpcRequestMock.mockResolvedValueOnce({
        error: ERROR_BODY_MOCK,
      });

      await expect(
        submitRelayTransaction({ ...SUBMIT_REQUEST_MOCK, chainId: '0x123' }),
      ).rejects.toThrow(`Chain not supported by transaction relay - 0x123`);
    });
  });
});
