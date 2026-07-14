import { CHAIN_IDS } from '@metamask/transaction-controller';
import {
  SentinelChainNotSupportedError,
  SentinelSmartTransactionStatus,
  type SentinelRelaySubmitRequest,
} from '@metamask-previews/sentinel-api-service';
import { flushPromises } from '../../../../test/lib/timer-helpers';
import {
  type SentinelRelayMessenger,
  isRelaySupported,
  submitRelayTransaction,
  waitForRelayResult,
} from './transaction-relay';

jest.useFakeTimers();

const TRANSACTION_HASH_MOCK = '0x123';
const UUID_MOCK = 'uuid-1';
const INTERVAL_MOCK = 1000;

const SUBMIT_REQUEST_MOCK: SentinelRelaySubmitRequest = {
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

/**
 * Builds a mock messenger backed by a jest `call` mock.
 *
 * @returns The mock messenger and its `call` jest mock.
 */
function buildMessengerMock() {
  const call = jest.fn();
  const messenger = { call } as unknown as SentinelRelayMessenger;
  return { messenger, call };
}

describe('Transaction Relay Utils', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllTimers();
  });

  describe('submitRelayTransaction', () => {
    it('submits request via the SentinelApiService messenger action', async () => {
      const { messenger, call } = buildMessengerMock();
      call.mockResolvedValueOnce({ uuid: UUID_MOCK });

      await submitRelayTransaction(messenger, SUBMIT_REQUEST_MOCK);

      expect(call).toHaveBeenCalledWith(
        'SentinelApiService:submitRelayTransaction',
        SUBMIT_REQUEST_MOCK,
      );
    });

    it('returns uuid from response if successful', async () => {
      const { messenger, call } = buildMessengerMock();
      call.mockResolvedValueOnce({ uuid: UUID_MOCK });

      const result = await submitRelayTransaction(
        messenger,
        SUBMIT_REQUEST_MOCK,
      );

      expect(result).toStrictEqual({ uuid: UUID_MOCK });
    });

    it('normalizes chain not supported errors', async () => {
      const { messenger, call } = buildMessengerMock();
      call.mockRejectedValueOnce(new SentinelChainNotSupportedError('0x123'));

      await expect(
        submitRelayTransaction(messenger, {
          ...SUBMIT_REQUEST_MOCK,
          chainId: '0x123',
        }),
      ).rejects.toThrow('Chain not supported by transaction relay - 0x123');
    });

    it('rethrows other errors unchanged', async () => {
      const { messenger, call } = buildMessengerMock();
      call.mockRejectedValueOnce(new Error('boom'));

      await expect(
        submitRelayTransaction(messenger, SUBMIT_REQUEST_MOCK),
      ).rejects.toThrow('boom');
    });
  });

  describe('waitForRelayResult', () => {
    it('returns transaction if successful', async () => {
      const { messenger, call } = buildMessengerMock();
      call.mockResolvedValueOnce({
        transactions: [
          {
            status: SentinelSmartTransactionStatus.Validated,
            hash: TRANSACTION_HASH_MOCK,
          },
        ],
      });

      const resultPromise = waitForRelayResult(messenger, WAIT_REQUEST_MOCK);
      await flushPromises();

      jest.advanceTimersByTime(INTERVAL_MOCK);

      const result = await resultPromise;

      expect(result).toStrictEqual({
        status: SentinelSmartTransactionStatus.Validated,
        hash: TRANSACTION_HASH_MOCK,
      });
    });

    it('returns status if unsuccessful', async () => {
      const { messenger, call } = buildMessengerMock();
      call.mockResolvedValueOnce({
        transactions: [{ status: 'TEST_STATUS' }],
      });

      const resultPromise = waitForRelayResult(messenger, WAIT_REQUEST_MOCK);
      await flushPromises();

      jest.advanceTimersByTime(INTERVAL_MOCK);

      const result = await resultPromise;

      expect(result).toStrictEqual({ status: 'TEST_STATUS' });
    });

    it('rejects if polling fails', async () => {
      const { messenger, call } = buildMessengerMock();
      call.mockRejectedValueOnce(new Error('status request failed'));

      const resultPromise = waitForRelayResult(messenger, WAIT_REQUEST_MOCK);
      await flushPromises();

      jest.advanceTimersByTime(INTERVAL_MOCK);

      await expect(resultPromise).rejects.toThrow('status request failed');
    });

    it('queries multiple times on interval until status not pending', async () => {
      const { messenger, call } = buildMessengerMock();
      call
        .mockResolvedValueOnce({
          transactions: [{ status: SentinelSmartTransactionStatus.Pending }],
        })
        .mockResolvedValueOnce({
          transactions: [{ status: SentinelSmartTransactionStatus.Pending }],
        })
        .mockResolvedValueOnce({
          transactions: [
            {
              status: SentinelSmartTransactionStatus.Validated,
              hash: TRANSACTION_HASH_MOCK,
            },
          ],
        });

      const resultPromise = waitForRelayResult(messenger, WAIT_REQUEST_MOCK);
      await flushPromises();

      jest.advanceTimersByTime(INTERVAL_MOCK);
      await flushPromises();
      jest.advanceTimersByTime(INTERVAL_MOCK);
      await flushPromises();
      jest.advanceTimersByTime(INTERVAL_MOCK);
      await flushPromises();

      expect(call).toHaveBeenCalledTimes(3);

      await resultPromise;
    });
  });

  describe('isRelaySupported', () => {
    it('returns true if networks request includes chain', async () => {
      const { messenger, call } = buildMessengerMock();
      call.mockResolvedValueOnce(NETWORKS_MOCK);

      const result = await isRelaySupported(messenger, CHAIN_IDS.MAINNET);

      expect(result).toBe(true);
    });

    it('returns false if networks request does not include chain', async () => {
      const { messenger, call } = buildMessengerMock();
      call.mockResolvedValueOnce({});

      const result = await isRelaySupported(messenger, CHAIN_IDS.MAINNET);

      expect(result).toBe(false);
    });

    it('returns false if relay flag disabled', async () => {
      const { messenger, call } = buildMessengerMock();
      call.mockResolvedValueOnce({
        1: { relayTransactions: false, network: 'test' },
      });

      const result = await isRelaySupported(messenger, CHAIN_IDS.MAINNET);

      expect(result).toBe(false);
    });

    it('returns false if networks request fails', async () => {
      const { messenger, call } = buildMessengerMock();
      call.mockRejectedValueOnce(new Error('network error'));

      const result = await isRelaySupported(messenger, CHAIN_IDS.MAINNET);

      expect(result).toBe(false);
    });
  });
});
