import { CHAIN_IDS } from '@metamask/transaction-controller';
import { flushPromises } from '../../../../test/lib/timer-helpers';
import {
  type SentinelApiMessenger,
  getSentinelApiMessenger,
  getSentinelNetworkFlags,
} from './sentinel-api';
import {
  RelayStatus,
  RelaySubmitRequest,
  isRelaySupported,
  submitRelayTransaction,
  waitForRelayResult,
} from './transaction-relay';

jest.useFakeTimers();

jest.mock('./sentinel-api');

const TRANSACTION_HASH_MOCK = '0x123';
const INTERVAL_MOCK = 1000;
const UUID_MOCK = 'uuid-123';

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

describe('Transaction Relay Utils', () => {
  const callMock = jest.fn();
  const getSentinelNetworkFlagsMock = jest.mocked(getSentinelNetworkFlags);

  function mockSmartTransaction(transaction?: {
    hash?: string;
    status: string;
  }) {
    callMock.mockResolvedValueOnce({
      transactions: transaction ? [transaction] : [],
    });
  }

  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllTimers();

    jest.mocked(getSentinelApiMessenger).mockReturnValue({
      call: callMock,
    } as unknown as SentinelApiMessenger);

    getSentinelNetworkFlagsMock.mockResolvedValue({
      network: 'test',
      relayTransactions: true,
    });
  });

  describe('submitRelayTransaction', () => {
    it('submits request to service', async () => {
      callMock.mockResolvedValueOnce({ uuid: UUID_MOCK });

      await submitRelayTransaction(SUBMIT_REQUEST_MOCK);

      expect(callMock).toHaveBeenCalledWith(
        'SentinelApiService:submitRelayTransaction',
        SUBMIT_REQUEST_MOCK,
      );
    });

    it('returns response from service', async () => {
      callMock.mockResolvedValueOnce({ uuid: UUID_MOCK });

      const result = await submitRelayTransaction(SUBMIT_REQUEST_MOCK);

      expect(result).toStrictEqual({ uuid: UUID_MOCK });
    });

    it('throws if chain not supported', async () => {
      getSentinelNetworkFlagsMock.mockResolvedValue(undefined);

      await expect(
        submitRelayTransaction({ ...SUBMIT_REQUEST_MOCK, chainId: '0x123' }),
      ).rejects.toThrow(`Chain not supported by transaction relay - 0x123`);

      expect(callMock).not.toHaveBeenCalled();
    });
  });

  describe('waitForRelayResult', () => {
    it('returns transaction if successful', async () => {
      mockSmartTransaction({
        hash: TRANSACTION_HASH_MOCK,
        status: RelayStatus.Success,
      });

      const resultPromise = waitForRelayResult(WAIT_REQUEST_MOCK);
      await flushPromises();

      jest.advanceTimersByTime(INTERVAL_MOCK);

      const result = await resultPromise;

      expect(callMock).toHaveBeenCalledWith(
        'SentinelApiService:getSmartTransaction',
        { chainId: CHAIN_IDS.MAINNET, uuid: UUID_MOCK },
      );

      expect(result).toStrictEqual({
        status: RelayStatus.Success,
        transactionHash: TRANSACTION_HASH_MOCK,
      });
    });

    it('returns status if unsuccessful', async () => {
      mockSmartTransaction({ status: 'TEST_STATUS' });

      const resultPromise = waitForRelayResult(WAIT_REQUEST_MOCK);
      await flushPromises();

      jest.advanceTimersByTime(INTERVAL_MOCK);

      const result = await resultPromise;

      expect(result).toStrictEqual({
        status: 'TEST_STATUS',
        transactionHash: undefined,
      });
    });

    it('returns undefined status if no transaction returned', async () => {
      mockSmartTransaction();

      const resultPromise = waitForRelayResult(WAIT_REQUEST_MOCK);
      await flushPromises();

      jest.advanceTimersByTime(INTERVAL_MOCK);

      const result = await resultPromise;

      expect(result).toStrictEqual({
        status: undefined,
        transactionHash: undefined,
      });
    });

    it('throws if polling fails', async () => {
      callMock.mockRejectedValueOnce(new Error('Test Error'));

      const resultPromise = waitForRelayResult(WAIT_REQUEST_MOCK);
      await flushPromises();

      jest.advanceTimersByTime(INTERVAL_MOCK);

      await expect(resultPromise).rejects.toThrow('Test Error');
    });

    it('throws if chain not supported', async () => {
      getSentinelNetworkFlagsMock.mockResolvedValue(undefined);

      await expect(waitForRelayResult(WAIT_REQUEST_MOCK)).rejects.toThrow(
        `Chain not supported by transaction relay - ${CHAIN_IDS.MAINNET}`,
      );
    });

    it('queries multiple times on interval until status not pending', async () => {
      mockSmartTransaction({ status: RelayStatus.Pending });
      mockSmartTransaction({ status: RelayStatus.Pending });
      mockSmartTransaction({
        hash: TRANSACTION_HASH_MOCK,
        status: RelayStatus.Success,
      });

      const resultPromise = waitForRelayResult(WAIT_REQUEST_MOCK);
      await flushPromises();

      jest.advanceTimersByTime(INTERVAL_MOCK);
      await flushPromises();
      jest.advanceTimersByTime(INTERVAL_MOCK);
      await flushPromises();
      jest.advanceTimersByTime(INTERVAL_MOCK);
      await flushPromises();

      expect(callMock).toHaveBeenCalledTimes(3);

      await resultPromise;
    });
  });

  describe('isRelaySupported', () => {
    it('returns true if relay flag enabled', async () => {
      const result = await isRelaySupported(CHAIN_IDS.MAINNET);

      expect(getSentinelNetworkFlagsMock).toHaveBeenCalledWith(
        CHAIN_IDS.MAINNET,
      );
      expect(result).toBe(true);
    });

    it('returns false if network not found', async () => {
      getSentinelNetworkFlagsMock.mockResolvedValue(undefined);

      const result = await isRelaySupported(CHAIN_IDS.MAINNET);
      expect(result).toBe(false);
    });

    it('returns false if relay flag disabled', async () => {
      getSentinelNetworkFlagsMock.mockResolvedValue({
        confirmations: false,
        network: 'test',
      });

      const result = await isRelaySupported(CHAIN_IDS.MAINNET);
      expect(result).toBe(false);
    });
  });
});
