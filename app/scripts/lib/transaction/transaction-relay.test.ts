import { CHAIN_IDS } from '@metamask/transaction-controller';
import { Json } from '@metamask/utils';
import { jsonRpcRequest } from '../../../../shared/modules/rpc.utils';
import getFetchWithTimeout from '../../../../shared/modules/fetch-with-timeout';
import {
  RELAY_RPC_METHOD,
  RelayStatus,
  RelaySubmitRequest,
  submitRelayTransaction,
  waitForRelayResult,
} from './transaction-relay';

jest.useFakeTimers();

jest.mock('../../../../shared/modules/rpc.utils');
jest.mock('../../../../shared/modules/fetch-with-timeout');

const TRANSACTION_HASH_MOCK = '0x123';
const ERROR_BODY_MOCK = 'test error';
const INTERVAL_MOCK = 1000;

const SUBMIT_REQUEST_MOCK: RelaySubmitRequest = {
  chainId: CHAIN_IDS.MAINNET,
  data: '0x1',
  to: '0x4',
};

const WAIT_REQUEST_MOCK = {
  chainId: CHAIN_IDS.MAINNET,
  interval: INTERVAL_MOCK,
  uuid: '0x123',
};

describe('Transaction Relay Utils', () => {
  const jsonRpcRequestMock = jest.mocked(jsonRpcRequest);

  const fetchMock: jest.MockedFunction<ReturnType<typeof getFetchWithTimeout>> =
    jest.fn();

  function mockFetchSuccess(response: Json) {
    fetchMock.mockResolvedValueOnce({
      json: async () => response,
      ok: true,
    } as Response);
  }

  function mockFetchError(response: string, status: number) {
    fetchMock.mockResolvedValueOnce({
      text: async () => response,
      status,
      ok: false,
    } as Response);
  }

  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllTimers();

    jsonRpcRequestMock.mockResolvedValue({
      transactionHash: TRANSACTION_HASH_MOCK,
    });

    jest.mocked(getFetchWithTimeout).mockReturnValue(fetchMock);
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

  describe('waitForRelayResult', () => {
    it('returns transaction if successful', async () => {
      mockFetchSuccess({
        transactions: [
          {
            hash: TRANSACTION_HASH_MOCK,
            status: RelayStatus.Success,
          },
        ],
      });

      const resultPromise = waitForRelayResult(WAIT_REQUEST_MOCK);
      jest.advanceTimersByTime(INTERVAL_MOCK);

      const result = await resultPromise;

      expect(result).toStrictEqual({
        status: RelayStatus.Success,
        transactionHash: TRANSACTION_HASH_MOCK,
      });
    });

    it('returns status if unsuccessful', async () => {
      mockFetchSuccess({
        transactions: [
          {
            status: 'TEST_STATUS',
          },
        ],
      });

      const resultPromise = waitForRelayResult(WAIT_REQUEST_MOCK);
      jest.advanceTimersByTime(INTERVAL_MOCK);

      const result = await resultPromise;

      expect(result).toStrictEqual({
        status: 'TEST_STATUS',
        transactionHash: undefined,
      });
    });

    it('throws if polling fails', async () => {
      mockFetchError('Test Error', 500);

      const resultPromise = waitForRelayResult(WAIT_REQUEST_MOCK);
      jest.advanceTimersByTime(INTERVAL_MOCK);

      await expect(resultPromise).rejects.toThrow(
        `Failed to fetch relay transaction status: 500 - Test Error`,
      );
    });

    it('queries multiple times on interval until status not pending', async () => {
      mockFetchSuccess({
        transactions: [
          {
            status: RelayStatus.Pending,
          },
        ],
      });

      mockFetchSuccess({
        transactions: [
          {
            status: RelayStatus.Pending,
          },
        ],
      });

      mockFetchSuccess({
        transactions: [
          {
            hash: TRANSACTION_HASH_MOCK,
            status: RelayStatus.Success,
          },
        ],
      });

      const resultPromise = waitForRelayResult(WAIT_REQUEST_MOCK);
      jest.advanceTimersByTime(INTERVAL_MOCK);
      jest.advanceTimersByTime(INTERVAL_MOCK);
      jest.advanceTimersByTime(INTERVAL_MOCK);

      expect(fetchMock).toHaveBeenCalledTimes(3);

      await resultPromise;
    });
  });
});
