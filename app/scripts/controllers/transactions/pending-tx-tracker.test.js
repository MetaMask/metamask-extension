import BN from 'bn.js';
import { TransactionStatus } from '../../../../shared/constants/transaction';
import PendingTransactionTracker from './pending-tx-tracker';

describe('PendingTransactionTracker', function () {
  describe('#resubmitPendingTxs', function () {
    it('should return early if there are no pending transactions', async function () {
      const getPendingTransactions = jest.fn().mockReturnValue([]);
      const pendingTxTracker = new PendingTransactionTracker({
        query: {
          getTransactionReceipt: jest.fn(),
        },
        nonceTracker: {
          getGlobalLock: jest.fn().mockResolvedValue({
            releaseLock: jest.fn(),
          }),
        },
        getPendingTransactions,
        getCompletedTransactions: jest.fn().mockReturnValue([]),
        approveTransaction: jest.fn(),
        publishTransaction: jest.fn(),
        confirmTransaction: jest.fn(),
      });
      const resubmitTx = jest
        .spyOn(pendingTxTracker, '_resubmitTx')
        .mockRejectedValueOnce();
      const warningListener = jest.fn();

      pendingTxTracker.on('tx:warning', warningListener);
      await pendingTxTracker.resubmitPendingTxs('0x1');

      expect(getPendingTransactions).toHaveBeenCalledTimes(1);
      expect(resubmitTx).toHaveBeenCalledTimes(0);
      expect(warningListener).toHaveBeenCalledTimes(0);
    });

    it('should resubmit each pending transaction', async function () {
      const getPendingTransactions = jest.fn().mockReturnValue([
        {
          id: 1,
        },
        {
          id: 2,
        },
      ]);
      const pendingTxTracker = new PendingTransactionTracker({
        query: {
          getTransactionReceipt: jest.fn(),
        },
        nonceTracker: {
          getGlobalLock: jest.fn().mockResolvedValue({
            releaseLock: jest.fn(),
          }),
        },
        getPendingTransactions,
        getCompletedTransactions: jest.fn().mockReturnValue([]),
        approveTransaction: jest.fn(),
        publishTransaction: jest.fn(),
        confirmTransaction: jest.fn(),
      });
      const resubmitTx = jest
        .spyOn(pendingTxTracker, '_resubmitTx')
        .mockResolvedValueOnce();
      const warningListener = jest.fn();

      pendingTxTracker.on('tx:warning', warningListener);
      await pendingTxTracker.resubmitPendingTxs('0x1');

      expect(getPendingTransactions).toHaveBeenCalledTimes(1);
      expect(resubmitTx).toHaveBeenCalledTimes(2);
      expect(warningListener).toHaveBeenCalledTimes(0);
    });

    it("should NOT emit 'tx:warning' for known failed resubmission", async function () {
      const getPendingTransactions = jest.fn().mockReturnValue([
        {
          id: 1,
        },
      ]);
      const pendingTxTracker = new PendingTransactionTracker({
        query: {
          getTransactionReceipt: jest.fn(),
        },
        nonceTracker: {
          getGlobalLock: jest.fn().mockResolvedValue({
            releaseLock: jest.fn(),
          }),
        },
        getPendingTransactions,
        getCompletedTransactions: jest.fn().mockReturnValue([]),
        approveTransaction: jest.fn(),
        publishTransaction: jest.fn(),
        confirmTransaction: jest.fn(),
      });
      const resubmitTx = jest
        .spyOn(pendingTxTracker, '_resubmitTx')
        .mockRejectedValueOnce({ message: 'known transaction' });
      const warningListener = jest.fn();

      pendingTxTracker.on('tx:warning', warningListener);
      await pendingTxTracker.resubmitPendingTxs('0x1');

      expect(getPendingTransactions).toHaveBeenCalledTimes(1);
      expect(resubmitTx).toHaveBeenCalledTimes(1);
      expect(warningListener).toHaveBeenCalledTimes(0);
    });

    it("should emit 'tx:warning' for unknown failed resubmission", async function () {
      const getPendingTransactions = jest.fn().mockReturnValue([
        {
          id: 1,
        },
      ]);
      const pendingTxTracker = new PendingTransactionTracker({
        query: {
          getTransactionReceipt: jest.fn(),
        },
        nonceTracker: {
          getGlobalLock: jest.fn().mockResolvedValue({
            releaseLock: jest.fn(),
          }),
        },
        getPendingTransactions,
        getCompletedTransactions: jest.fn().mockReturnValue([]),
        approveTransaction: jest.fn(),
        publishTransaction: jest.fn(),
        confirmTransaction: jest.fn(),
      });
      const resubmitTx = jest
        .spyOn(pendingTxTracker, '_resubmitTx')
        .mockRejectedValueOnce({ message: 'who dis' });
      const warningListener = jest.fn();

      pendingTxTracker.on('tx:warning', warningListener);
      await pendingTxTracker.resubmitPendingTxs('0x1');

      expect(getPendingTransactions).toHaveBeenCalledTimes(1);
      expect(resubmitTx).toHaveBeenCalledTimes(1);
      expect(warningListener).toHaveBeenCalledTimes(1);
    });
  });

  describe('#updatePendingTxs', function () {
    it('should call _checkPendingTx for each pending transaction', async function () {
      const txMeta = {
        id: 1,
        hash: '0x0593ee121b92e10d63150ad08b4b8f9c7857d1bd160195ee648fb9a0f8d00eeb',
        status: TransactionStatus.signed,
        txParams: {
          from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          nonce: '0x1',
          value: '0xfffff',
        },
        history: [{}],
        rawTx:
          '0xf86c808504a817c800827b0d940c62bb85faa3311a998d3aba8098c1235c564966880de0b6b3a7640000802aa08ff665feb887a25d4099e40e11f0fef93ee9608f404bd3f853dd9e84ed3317a6a02ec9d3d1d6e176d4d2593dd760e74ccac753e6a0ea0d00cc9789d0d7ff1f471d',
      };
      const txList = [1, 2, 3].map((id) => ({ ...txMeta, id }));
      const pendingTxTracker = new PendingTransactionTracker({
        query: {
          getTransactionReceipt: jest.fn(),
        },
        nonceTracker: {
          getGlobalLock: async () => {
            return { releaseLock: () => undefined };
          },
        },
        getPendingTransactions: () => txList,
        getCompletedTransactions: () => {
          return [];
        },
        publishTransaction: () => undefined,
        confirmTransaction: () => undefined,
      });

      const checkPendingTxStub = jest
        .spyOn(pendingTxTracker, '_checkPendingTx')
        .mockResolvedValue();
      await pendingTxTracker.updatePendingTxs();

      expect(checkPendingTxStub).toHaveBeenCalledTimes(3);
      expect(checkPendingTxStub).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1 }),
      );
      expect(checkPendingTxStub).toHaveBeenCalledWith(
        expect.objectContaining({ id: 2 }),
      );
      expect(checkPendingTxStub).toHaveBeenCalledWith(
        expect.objectContaining({ id: 3 }),
      );
    });
  });

  describe('#_resubmitTx', function () {
    it('should publish a new transaction', async function () {
      const txMeta = {
        id: 1,
        hash: '0x0593ee121b92e10d63150ad08b4b8f9c7857d1bd160195ee648fb9a0f8d00eeb',
        status: TransactionStatus.signed,
        txParams: {
          from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          nonce: '0x1',
          value: '0xfffff',
        },
        history: [{}],
        rawTx:
          '0xf86c808504a817c80086a02ec9d3d1d6e176d4d2593dd760e74ccac753e6a0ea0d00cc9789d0d7ff1f471d',
      };
      const approveTransaction = jest.fn();
      const publishTransaction = jest.fn();
      const pendingTxTracker = new PendingTransactionTracker({
        query: {
          getTransactionReceipt: jest.fn(),
        },
        nonceTracker: {
          getGlobalLock: jest.fn().mockResolvedValue({
            releaseLock: jest.fn(),
          }),
        },
        getPendingTransactions: jest.fn().mockReturnValue([]),
        getCompletedTransactions: jest.fn().mockReturnValue([]),
        approveTransaction,
        publishTransaction,
        confirmTransaction: jest.fn(),
      });

      await pendingTxTracker._resubmitTx(txMeta);

      expect(publishTransaction).toHaveBeenCalledWith(txMeta.rawTx);
      expect(approveTransaction).toHaveBeenCalledTimes(0);
    });

    it('should publish the given transaction if more than 2**retryCount blocks have passed', async function () {
      const txMeta = {
        id: 1,
        hash: '0x0593ee121b92e10d63150ad08b4b8f9c7857d1bd160195ee648fb9a0f8d00eeb',
        status: TransactionStatus.signed,
        txParams: {
          from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          nonce: '0x1',
          value: '0xfffff',
        },
        history: [{}],
        rawTx:
          '0xf86c808504a817c800827b0d940c62bb85faa3311a996e176d4d2593dd760e74ccac753e6a0ea0d00cc9789d0d7ff1f471d',
        retryCount: 4,
        firstRetryBlockNumber: '0x1',
      };
      const approveTransaction = jest.fn();
      const publishTransaction = jest.fn();
      const pendingTxTracker = new PendingTransactionTracker({
        query: {
          getTransactionReceipt: jest.fn(),
        },
        nonceTracker: {
          getGlobalLock: jest.fn().mockResolvedValue({
            releaseLock: jest.fn(),
          }),
        },
        getPendingTransactions: jest.fn().mockReturnValue([]),
        getCompletedTransactions: jest.fn().mockReturnValue([]),
        publishTransaction,
        approveTransaction,
        confirmTransaction: jest.fn(),
      });

      await pendingTxTracker._resubmitTx(txMeta, '0x11' /* 16 */);

      expect(publishTransaction).toHaveBeenCalledWith(txMeta.rawTx);
      expect(approveTransaction).toHaveBeenCalledTimes(0);
    });

    it('should NOT publish the given transaction if fewer than 2**retryCount blocks have passed', async function () {
      const txMeta = {
        id: 1,
        hash: '0x0593ee121b92e10d63150ad08b4b8f9c7857d1bd160195ee648fb9a0f8d00eeb',
        status: TransactionStatus.signed,
        txParams: {
          from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          nonce: '0x1',
          value: '0xfffff',
        },
        history: [{}],
        rawTx:
          '0xf86c808504a817c800827b0d940c62bb85faa3311a996e176d4d2593dd760e74ccac753e6a0ea0d00cc9789d0d7ff1f471d',
        retryCount: 4,
        firstRetryBlockNumber: '0x1',
      };
      const approveTransaction = jest.fn();
      const publishTransaction = jest.fn();
      const pendingTxTracker = new PendingTransactionTracker({
        query: {
          getTransactionReceipt: jest.fn(),
        },
        nonceTracker: {
          getGlobalLock: jest.fn().mockResolvedValue({
            releaseLock: jest.fn(),
          }),
        },
        getPendingTransactions: jest.fn().mockReturnValue([]),
        getCompletedTransactions: jest.fn().mockReturnValue([]),
        publishTransaction,
        approveTransaction,
        confirmTransaction: jest.fn(),
      });

      await pendingTxTracker._resubmitTx(txMeta, '0x5');

      expect(publishTransaction).toHaveBeenCalledTimes(0);
      expect(approveTransaction).toHaveBeenCalledTimes(0);
    });

    it('should call approveTransaction if the tx is not yet signed', async function () {
      const approveTransaction = jest.fn();
      const publishTransaction = jest.fn();
      const pendingTxTracker = new PendingTransactionTracker({
        query: {
          getTransactionReceipt: jest.fn(),
        },
        nonceTracker: {
          getGlobalLock: jest.fn().mockResolvedValue({
            releaseLock: jest.fn(),
          }),
        },
        getPendingTransactions: jest.fn().mockReturnValue([]),
        getCompletedTransactions: jest.fn().mockReturnValue([]),
        approveTransaction,
        publishTransaction,
        confirmTransaction: jest.fn(),
      });

      await pendingTxTracker._resubmitTx({ id: 40 });

      expect(approveTransaction).toHaveBeenCalledWith(40);
      expect(publishTransaction).toHaveBeenCalledTimes(0);
    });

    it('should return undefined if txMeta has custodyId property', async function () {
      const txMeta = {
        custodyId: 1,
        id: 1,
        hash: '0x0593ee121b92e10d63150ad08b4b8f9c7857d1bd160195ee648fb9a0f8d00eeb',
        status: TransactionStatus.signed,
        txParams: {
          from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          nonce: '0x1',
          value: '0xfffff',
        },
        history: [{}],
        rawTx:
          '0xf86c808504a817c80086a02ec9d3d1d6e176d4d2593dd760e74ccac753e6a0ea0d00cc9789d0d7ff1f471d',
      };
      const approveTransaction = jest.fn();
      const publishTransaction = jest.fn();
      const pendingTxTracker = new PendingTransactionTracker({
        query: {
          getTransactionReceipt: jest.fn(),
        },
        nonceTracker: {
          getGlobalLock: jest.fn().mockResolvedValue({
            releaseLock: jest.fn(),
          }),
        },
        getPendingTransactions: jest.fn().mockReturnValue([]),
        getCompletedTransactions: jest.fn().mockReturnValue([]),
        approveTransaction,
        publishTransaction,
        confirmTransaction: jest.fn(),
      });

      const result = await pendingTxTracker._resubmitTx(txMeta);
      expect(result).toBeUndefined();
    });
  });

  describe('#_checkIfTxWasDropped', function () {
    it('should return true when the given nonce is lower than the network nonce', async function () {
      const nonceBN = new BN(2);
      const pendingTxTracker = new PendingTransactionTracker({
        query: {
          getTransactionReceipt: jest.fn(),
          getTransactionCount: jest.fn().mockResolvedValue(nonceBN),
        },
        nonceTracker: {
          getGlobalLock: jest.fn().mockResolvedValue({
            releaseLock: jest.fn(),
          }),
        },
        getPendingTransactions: jest.fn().mockReturnValue([]),
        getCompletedTransactions: jest.fn().mockReturnValue([]),
        publishTransaction: jest.fn(),
        confirmTransaction: jest.fn(),
      });

      pendingTxTracker.DROPPED_BUFFER_COUNT = 0;

      expect(
        await pendingTxTracker._checkIfTxWasDropped({
          id: 1,
          hash: '0x0593ee121b92e10d63150ad08b4b8f9c7857d1bd160195ee648fb9a0f8d00eeb',
          status: TransactionStatus.submitted,
          txParams: {
            from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
            nonce: '0x1',
            value: '0xfffff',
          },
          rawTx: '0xf86c808504a817c800827b0d940c62bba0ea0d00cc9789d0d7ff1f471d',
        }),
      ).toBeTruthy();
    });

    it('should return false when the given nonce is the network nonce', async function () {
      const nonceBN = new BN(1);
      const pendingTxTracker = new PendingTransactionTracker({
        query: {
          getTransactionReceipt: jest.fn(),
          getTransactionCount: jest.fn().mockResolvedValue(nonceBN),
        },
        nonceTracker: {
          getGlobalLock: jest.fn().mockResolvedValue({
            releaseLock: jest.fn(),
          }),
        },
        getPendingTransactions: jest.fn().mockReturnValue([]),
        getCompletedTransactions: jest.fn().mockReturnValue([]),
        publishTransaction: jest.fn(),
        confirmTransaction: jest.fn(),
      });

      const dropped = await pendingTxTracker._checkIfTxWasDropped({
        id: 1,
        hash: '0x0593ee121b92e10d63150ad08b4b8f9c7857d1bd160195ee648fb9a0f8d00eeb',
        status: TransactionStatus.submitted,
        txParams: {
          from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          nonce: '0x1',
          value: '0xfffff',
        },
        rawTx:
          '0xf86c808504a89e84ed3317a6a02ec9d3d1d6e176d4d2593dd760e74ccac753e6a0ea0d00cc9789d0d7ff1f471d',
      });

      expect(dropped).toBeFalsy();
    });
  });

  describe('#_checkIfNonceIsTaken', function () {
    it('should return false if the given nonce is not taken', async function () {
      const confirmedTxList = [
        {
          id: 1,
          hash: '0x0593ee121b92e10d63150ad08b4b8f9c7857d1bd160195ee648fb9a0f8d00eeb',
          status: TransactionStatus.confirmed,
          txParams: {
            from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
            nonce: '0x1',
            value: '0xfffff',
          },
          rawTx:
            '0xf86c808504a817c800827b0d940c62bb85fa3320e74ccac753e6a0ea0d00cc9789d0d7ff1f471d',
        },
        {
          id: 2,
          hash: '0x0593ee121b92e10d63150ad08b4b8f9c7857d1bd160195ee648fb9a0f8d00eeb',
          status: TransactionStatus.confirmed,
          txParams: {
            from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
            nonce: '0x2',
            value: '0xfffff',
          },
          rawTx:
            '0xf86c808507a6a02ec9d3d1d6e176d4d2593dd760e74ccac753e6a0ea0d00cc9789d0d7ff1f471d',
        },
      ];
      const getCompletedTransactions = jest
        .fn()
        .mockReturnValue(confirmedTxList);
      const pendingTxTracker = new PendingTransactionTracker({
        query: jest.fn(),
        nonceTracker: {
          getGlobalLock: jest.fn().mockResolvedValue({
            releaseLock: jest.fn(),
          }),
        },
        getPendingTransactions: jest.fn().mockReturnValue([]),
        getCompletedTransactions,
        publishTransaction: jest.fn(),
        confirmTransaction: jest.fn(),
      });

      const taken = await pendingTxTracker._checkIfNonceIsTaken({
        txParams: {
          from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          nonce: '0x3',
          value: '0xfffff',
        },
      });

      expect(getCompletedTransactions).toHaveBeenCalledWith(
        '0x1678a085c290ebd122dc42cba69373b5953b831d',
      );
      expect(taken).toBeFalsy();
    });

    it('should return true if the nonce is taken', async function () {
      const confirmedTxList = [
        {
          id: 1,
          hash: '0x0593ee121b92e10d63150ad08b4b8f9c7857d1bd160195ee648fb9a0f8d00eeb',
          status: TransactionStatus.confirmed,
          txParams: {
            from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
            nonce: '0x1',
            value: '0xfffff',
          },
          rawTx:
            '0xf86c808504a817c80082ec9d3d1d6e176d4d2593dd760e74ccac753e6a0ea0d00cc9789d0d7ff1f471d',
        },
        {
          id: 2,
          hash: '0x0593ee121b92e10d63150ad08b4b8f9c7857d1bd160195ee648fb9a0f8d00eeb',
          status: TransactionStatus.confirmed,
          txParams: {
            from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
            nonce: '0x2',
            value: '0xfffff',
          },
          rawTx:
            '0xf86c808504a817c800827b0d940c62bb760e74ccac753e6a0ea0d00cc9789d0d7ff1f471d',
        },
      ];
      const getCompletedTransactions = jest
        .fn()
        .mockReturnValue(confirmedTxList);
      const pendingTxTracker = new PendingTransactionTracker({
        query: jest.fn(),
        nonceTracker: {
          getGlobalLock: jest.fn().mockResolvedValue({
            releaseLock: jest.fn(),
          }),
        },
        getPendingTransactions: jest.fn().mockReturnValue([]),
        getCompletedTransactions,
        publishTransaction: jest.fn(),
        confirmTransaction: jest.fn(),
      });

      const taken = await pendingTxTracker._checkIfNonceIsTaken({
        txParams: {
          from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          nonce: '0x2',
          value: '0xfffff',
        },
      });

      expect(getCompletedTransactions).toHaveBeenCalledWith(
        '0x1678a085c290ebd122dc42cba69373b5953b831d',
      );
      expect(taken).toBeTruthy();
    });
  });

  describe('#_checkPendingTx', function () {
    it("should emit 'tx:confirmed' if getTransactionReceipt succeeds", async function () {
      const txMeta = {
        id: 1,
        hash: '0x0593ee121b92e10d63150ad08b4b8f9c7857d1bd160195ee648fb9a0f8d00eeb',
        status: TransactionStatus.submitted,
        txParams: {
          from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          nonce: '0x1',
          value: '0xfffff',
        },
        history: [{}],
        rawTx: '0xf86c808504a817c80082471d',
        custodyId: 'testid',
      };
      const resolvedTxReceipt = {
        from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
        transactionHash:
          '0x0593ee121b92e10d63150ad08b4b8f9c7857d1bd160195ee648fb9a0f8d00eeb',
        logs: [
          {
            address: '0xf56dc6695cf1f5c364edebc7dc7077ac9b586068',
            topics: [
              '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
              '0x0000000000000000000000001678a085c290ebd122dc42cba69373b5953b831d',
              '0x000000000000000000000000c04bf211972cea9a10f30bc81b0257aa51f024c6',
            ],
          },
        ],
        blockNumber: '0xa8532',
        status: '0x1',
        to: '0xf56dc6695cf1f5c364edebc7dc7077ac9b586068',
      };
      const nonceBN = new BN(2);
      const pendingTxTracker = new PendingTransactionTracker({
        query: {
          getTransactionReceipt: jest.fn().mockResolvedValue(resolvedTxReceipt),
          getTransactionCount: jest.fn().mockResolvedValue(nonceBN),
          getBlockByHash: jest.fn().mockResolvedValue({
            timestamp: '0x64605d3e',
            baseFeePerGas: '0x8',
          }),
        },
        nonceTracker: {
          getGlobalLock: jest.fn().mockResolvedValue({
            releaseLock: jest.fn(),
          }),
        },
        getPendingTransactions: jest.fn().mockReturnValue([]),
        getCompletedTransactions: jest.fn().mockReturnValue([]),
        publishTransaction: jest.fn(),
        confirmTransaction: jest.fn(),
        addTokens: jest.fn(),
        getTokenStandardAndDetails: jest.fn(),
        trackMetaMetricsEvent: jest.fn(),
      });

      const listeners = {
        confirmed: jest.fn(),
        dropped: jest.fn(),
        failed: jest.fn(),
        warning: jest.fn(),
      };

      pendingTxTracker.once('tx:confirmed', listeners.confirmed);
      pendingTxTracker.once('tx:dropped', listeners.dropped);
      pendingTxTracker.once('tx:failed', listeners.failed);
      pendingTxTracker.once('tx:warning', listeners.warning);
      await pendingTxTracker._checkPendingTx(txMeta);

      expect(listeners.dropped).toHaveBeenCalledTimes(0);
      expect(listeners.confirmed).toHaveBeenCalledTimes(1);
      expect(listeners.failed).toHaveBeenCalledTimes(0);
      expect(listeners.warning).toHaveBeenCalledTimes(0);
    });
  });
});
