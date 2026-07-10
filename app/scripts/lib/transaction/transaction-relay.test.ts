import { CHAIN_IDS } from '@metamask/transaction-controller';
import { flushPromises } from '../../../../test/lib/timer-helpers';
import {
  RelayStatus,
  RelaySubmitRequest,
  isRelaySupported,
  submitRelayTransaction,
  waitForRelayResult,
} from './transaction-relay';
import { resetSentinelApiService } from './sentinel-api-service';

jest.useFakeTimers();

const TRANSACTION_HASH_MOCK = '0x123';
const UUID_MOCK = 'uuid-1';
const INTERVAL_MOCK = 1000;

const SUBMIT_REQUEST_MOCK: RelaySubmitRequest = {
  chainId: CHAIN_IDS.MAINNET,
  data: '0x1',
  to: '0x4',
};

const WAIT_REQUEST_MOCK = {
  chainId: CHAIN_IDS.MAINNET,
  interval: INTERVAL_MOCK,
  uuid: UUID_MOCK,
};

const NETWORKS_MOCK = {
  1: {
    relayTransactions: true,
    network: 'test',
  },
};

describe('Transaction Relay Utils', () => {
  const fetchMock = jest.fn<Promise<Response>, [string, RequestInit?]>();

  /**
   * Builds a mock `Response` resolving to the given JSON body.
   *
   * @param json - The JSON body the response resolves to.
   * @param ok - Whether the response is a 2xx response. Defaults to true.
   * @param status - The HTTP status. Defaults to 200 / 500 based on `ok`.
   * @returns The mock response.
   */
  function response(
    json: unknown,
    ok = true,
    status = ok ? 200 : 500,
  ): Response {
    return {
      ok,
      status,
      json: async () => json,
      text: async () => JSON.stringify(json),
    } as Response;
  }

  /**
   * Mocks the next `fetch` call as a successful `/networks` registry response.
   */
  function mockNetworks() {
    fetchMock.mockResolvedValueOnce(response(NETWORKS_MOCK));
  }

  /**
   * Mocks the next `fetch` call as a successful JSON-RPC `result` response.
   *
   * @param result - The JSON-RPC `result` value.
   */
  function mockRpcResult(result: unknown) {
    fetchMock.mockResolvedValueOnce(
      response({ id: '1', jsonrpc: '2.0', result }),
    );
  }

  /**
   * Mocks the next `fetch` call as a relay status GET response.
   *
   * @param json - The status response body.
   */
  function mockStatus(json: unknown) {
    fetchMock.mockResolvedValueOnce(response(json));
  }

  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllTimers();
    resetSentinelApiService();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  describe('submitRelayTransaction', () => {
    it('submits request to API with client headers', async () => {
      mockNetworks();
      mockRpcResult({ uuid: UUID_MOCK });

      await submitRelayTransaction(SUBMIT_REQUEST_MOCK);

      const submitCall = fetchMock.mock.calls[1];
      expect(submitCall[1]?.method).toBe('POST');
      expect(
        (submitCall[1]?.headers as Record<string, string>)['X-Client-Id'],
      ).toBe('extension');
    });

    it('returns uuid from response if successful', async () => {
      mockNetworks();
      mockRpcResult({ uuid: UUID_MOCK });

      const result = await submitRelayTransaction(SUBMIT_REQUEST_MOCK);

      expect(result).toStrictEqual({ uuid: UUID_MOCK });
    });

    it('throws if chain not supported', async () => {
      fetchMock.mockResolvedValueOnce(response({}));

      await expect(
        submitRelayTransaction({ ...SUBMIT_REQUEST_MOCK, chainId: '0x123' }),
      ).rejects.toThrow(`Chain not supported by transaction relay - 0x123`);
    });
  });

  describe('waitForRelayResult', () => {
    it('returns transaction if successful', async () => {
      mockNetworks();
      mockStatus({
        transactions: [
          {
            hash: TRANSACTION_HASH_MOCK,
            status: RelayStatus.Success,
          },
        ],
      });

      const resultPromise = waitForRelayResult(WAIT_REQUEST_MOCK);
      await flushPromises();

      jest.advanceTimersByTime(INTERVAL_MOCK);

      const result = await resultPromise;

      expect(result).toStrictEqual({
        status: RelayStatus.Success,
        transactionHash: TRANSACTION_HASH_MOCK,
      });
    });

    it('returns status if unsuccessful', async () => {
      mockNetworks();
      mockStatus({
        transactions: [
          {
            status: 'TEST_STATUS',
          },
        ],
      });

      const resultPromise = waitForRelayResult(WAIT_REQUEST_MOCK);
      await flushPromises();

      jest.advanceTimersByTime(INTERVAL_MOCK);

      const result = await resultPromise;

      expect(result).toStrictEqual({
        status: 'TEST_STATUS',
      });
    });

    it('throws if polling fails', async () => {
      mockNetworks();
      fetchMock.mockResolvedValueOnce(response({}, false, 500));

      const resultPromise = waitForRelayResult(WAIT_REQUEST_MOCK);
      await flushPromises();

      jest.advanceTimersByTime(INTERVAL_MOCK);

      await expect(resultPromise).rejects.toThrow(
        `Sentinel relay status request failed with status '500'`,
      );
    });

    it('queries multiple times on interval until status not pending', async () => {
      mockNetworks();
      mockStatus({ transactions: [{ status: RelayStatus.Pending }] });
      mockStatus({ transactions: [{ status: RelayStatus.Pending }] });
      mockStatus({
        transactions: [
          {
            hash: TRANSACTION_HASH_MOCK,
            status: RelayStatus.Success,
          },
        ],
      });

      const resultPromise = waitForRelayResult(WAIT_REQUEST_MOCK);
      await flushPromises();

      jest.advanceTimersByTime(INTERVAL_MOCK);
      await flushPromises();
      jest.advanceTimersByTime(INTERVAL_MOCK);
      await flushPromises();
      jest.advanceTimersByTime(INTERVAL_MOCK);
      await flushPromises();

      // 1 networks request (cached thereafter) + 3 status requests.
      expect(fetchMock).toHaveBeenCalledTimes(4);

      await resultPromise;
    });
  });

  describe('isRelaySupported', () => {
    it('returns true if networks request includes chain', async () => {
      mockNetworks();
      const result = await isRelaySupported(CHAIN_IDS.MAINNET);
      expect(result).toBe(true);
    });

    it('returns false if networks request does not include chain', async () => {
      fetchMock.mockResolvedValueOnce(response({}));

      const result = await isRelaySupported(CHAIN_IDS.MAINNET);
      expect(result).toBe(false);
    });

    it('returns false if relay flag disabled', async () => {
      fetchMock.mockResolvedValueOnce(
        response({
          1: {
            relayTransactions: false,
            network: 'test',
          },
        }),
      );

      const result = await isRelaySupported(CHAIN_IDS.MAINNET);
      expect(result).toBe(false);
    });

    it('returns false if networks request fails', async () => {
      fetchMock.mockRejectedValueOnce(new Error('network error'));

      const result = await isRelaySupported(CHAIN_IDS.MAINNET);
      expect(result).toBe(false);
    });
  });
});
