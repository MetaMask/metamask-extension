import { strict as assert } from 'assert';
import sinon from 'sinon';
import { TRANSACTION_STATUSES } from '../../../../shared/constants/transaction';
import {
  KOVAN_CHAIN_ID,
  KOVAN_NETWORK_ID,
} from '../../../../shared/constants/network';
import TxStateManager from './tx-state-manager';
import { snapshotFromTxMeta } from './lib/tx-state-history-helpers';

const VALID_ADDRESS = '0x0000000000000000000000000000000000000000';
const VALID_ADDRESS_TWO = '0x0000000000000000000000000000000000000001';
describe('TransactionStateManager', function () {
  let txStateManager;
  const currentNetworkId = KOVAN_NETWORK_ID;
  const currentChainId = KOVAN_CHAIN_ID;
  const otherNetworkId = '2';

  beforeEach(function () {
    txStateManager = new TxStateManager({
      initState: {
        transactions: {},
      },
      txHistoryLimit: 10,
      getNetwork: () => currentNetworkId,
      getCurrentChainId: () => currentChainId,
    });
  });

  describe('#setTxStatusSigned', function () {
    it('sets the tx status to signed', function () {
      const tx = {
        id: 1,
        status: TRANSACTION_STATUSES.UNAPPROVED,
        metamaskNetworkId: currentNetworkId,
        txParams: {
          to: VALID_ADDRESS,
          from: VALID_ADDRESS,
        },
      };
      txStateManager.addTransaction(tx);
      txStateManager.setTxStatusSigned(1);
      const result = txStateManager.getTransactions();
      assert.ok(Array.isArray(result));
      assert.equal(result.length, 1);
      assert.equal(result[0].status, TRANSACTION_STATUSES.SIGNED);
    });

    it('should emit a signed event to signal the execution of callback', function () {
      const tx = {
        id: 1,
        status: TRANSACTION_STATUSES.UNAPPROVED,
        metamaskNetworkId: currentNetworkId,
        txParams: {
          to: VALID_ADDRESS,
          from: VALID_ADDRESS,
        },
      };
      const clock = sinon.useFakeTimers();
      const onSigned = sinon.spy();

      txStateManager.addTransaction(tx);
      txStateManager.on('1:signed', onSigned);
      txStateManager.setTxStatusSigned(1);
      clock.runAll();
      clock.restore();

      assert.ok(onSigned.calledOnce);
    });
  });

  describe('#setTxStatusRejected', function () {
    it('sets the tx status to rejected and removes it from history', function () {
      const tx = {
        id: 1,
        status: TRANSACTION_STATUSES.UNAPPROVED,
        metamaskNetworkId: currentNetworkId,
        txParams: {
          to: VALID_ADDRESS,
          from: VALID_ADDRESS,
        },
      };
      txStateManager.addTransaction(tx);
      txStateManager.setTxStatusRejected(1);
      const result = txStateManager.getTransactions();
      assert.ok(Array.isArray(result));
      assert.equal(result.length, 0);
    });

    it('should emit a rejected event to signal the execution of callback', function () {
      const tx = {
        id: 1,
        status: TRANSACTION_STATUSES.UNAPPROVED,
        metamaskNetworkId: currentNetworkId,
        txParams: {
          to: VALID_ADDRESS,
          from: VALID_ADDRESS,
        },
      };
      const clock = sinon.useFakeTimers();
      const onSigned = sinon.spy();

      txStateManager.addTransaction(tx);
      txStateManager.on('1:rejected', onSigned);
      txStateManager.setTxStatusRejected(1);
      clock.runAll();
      clock.restore();

      assert.ok(onSigned.calledOnce);
    });
  });

  describe('#getTransactions', function () {
    it('when new should return empty array', function () {
      const result = txStateManager.getTransactions();
      assert.ok(Array.isArray(result));
      assert.equal(result.length, 0);
    });

    it('should return a full list of transactions', function () {
      const submittedTx = {
        id: 0,
        metamaskNetworkId: currentNetworkId,
        time: 0,
        txParams: {
          from: '0xAddress',
          to: '0xRecipient',
          nonce: '0x0',
        },
        status: TRANSACTION_STATUSES.SUBMITTED,
      };

      const confirmedTx = {
        id: 3,
        metamaskNetworkId: currentNetworkId,
        time: 3,
        txParams: {
          from: '0xAddress',
          to: '0xRecipient',
          nonce: '0x3',
        },
        status: TRANSACTION_STATUSES.CONFIRMED,
      };

      const txm = new TxStateManager({
        initState: {
          transactions: {
            [submittedTx.id]: submittedTx,
            [confirmedTx.id]: confirmedTx,
          },
        },
        getNetwork: () => currentNetworkId,
        getCurrentChainId: () => currentChainId,
      });

      assert.deepEqual(txm.getTransactions(), [submittedTx, confirmedTx]);
    });

    it('should return a list of transactions, limited by N unique nonces when there are NO duplicates', function () {
      const submittedTx0 = {
        id: 0,
        metamaskNetworkId: currentNetworkId,
        time: 0,
        txParams: {
          from: '0xAddress',
          to: '0xRecipient',
          nonce: '0x0',
        },
        status: TRANSACTION_STATUSES.SUBMITTED,
      };

      const unapprovedTx1 = {
        id: 1,
        metamaskNetworkId: currentNetworkId,
        time: 1,
        txParams: {
          from: '0xAddress',
          to: '0xRecipient',
          nonce: '0x1',
        },
        status: TRANSACTION_STATUSES.UNAPPROVED,
      };

      const approvedTx2 = {
        id: 2,
        metamaskNetworkId: currentNetworkId,
        time: 2,
        txParams: {
          from: '0xAddress',
          to: '0xRecipient',
          nonce: '0x2',
        },
        status: TRANSACTION_STATUSES.APPROVED,
      };

      const confirmedTx3 = {
        id: 3,
        metamaskNetworkId: currentNetworkId,
        time: 3,
        txParams: {
          from: '0xAddress',
          to: '0xRecipient',
          nonce: '0x3',
        },
        status: TRANSACTION_STATUSES.CONFIRMED,
      };

      const txm = new TxStateManager({
        initState: {
          transactions: {
            [submittedTx0.id]: submittedTx0,
            [unapprovedTx1.id]: unapprovedTx1,
            [approvedTx2.id]: approvedTx2,
            [confirmedTx3.id]: confirmedTx3,
          },
        },
        getNetwork: () => currentNetworkId,
        getCurrentChainId: () => currentChainId,
      });

      assert.deepEqual(txm.getTransactions({ limit: 2 }), [
        approvedTx2,
        confirmedTx3,
      ]);
    });

    it('should return a list of transactions, limited by N unique nonces when there ARE duplicates', function () {
      const submittedTx0 = {
        id: 0,
        metamaskNetworkId: currentNetworkId,
        time: 0,
        txParams: {
          from: '0xAddress',
          to: '0xRecipient',
          nonce: '0x0',
        },
        status: TRANSACTION_STATUSES.SUBMITTED,
      };
      const submittedTx0Dupe = {
        id: 1,
        metamaskNetworkId: currentNetworkId,
        time: 0,
        txParams: {
          from: '0xAddress',
          to: '0xRecipient',
          nonce: '0x0',
        },
        status: TRANSACTION_STATUSES.SUBMITTED,
      };

      const unapprovedTx1 = {
        id: 2,
        metamaskNetworkId: currentNetworkId,
        chainId: currentChainId,
        time: 1,
        txParams: {
          from: '0xAddress',
          to: '0xRecipient',
          nonce: '0x1',
        },
        status: TRANSACTION_STATUSES.UNAPPROVED,
      };

      const approvedTx2 = {
        id: 3,
        metamaskNetworkId: currentNetworkId,
        time: 2,
        txParams: {
          from: '0xAddress',
          to: '0xRecipient',
          nonce: '0x2',
        },
        status: TRANSACTION_STATUSES.APPROVED,
      };
      const approvedTx2Dupe = {
        id: 4,
        metamaskNetworkId: currentNetworkId,
        chainId: currentChainId,
        time: 2,
        txParams: {
          from: '0xAddress',
          to: '0xRecipient',
          nonce: '0x2',
        },
        status: TRANSACTION_STATUSES.APPROVED,
      };

      const failedTx3 = {
        id: 5,
        metamaskNetworkId: currentNetworkId,
        time: 3,
        txParams: {
          from: '0xAddress',
          to: '0xRecipient',
          nonce: '0x3',
        },
        status: TRANSACTION_STATUSES.FAILED,
      };
      const failedTx3Dupe = {
        id: 6,
        metamaskNetworkId: currentNetworkId,
        chainId: currentChainId,
        time: 3,
        txParams: {
          from: '0xAddress',
          to: '0xRecipient',
          nonce: '0x3',
        },
        status: TRANSACTION_STATUSES.FAILED,
      };

      const txm = new TxStateManager({
        initState: {
          transactions: {
            [submittedTx0.id]: submittedTx0,
            [submittedTx0Dupe.id]: submittedTx0Dupe,

            [unapprovedTx1.id]: unapprovedTx1,
            [approvedTx2.id]: approvedTx2,
            [approvedTx2Dupe.id]: approvedTx2Dupe,

            [failedTx3.id]: failedTx3,
            [failedTx3Dupe.id]: failedTx3Dupe,
          },
        },
        getNetwork: () => currentNetworkId,
        getCurrentChainId: () => currentChainId,
      });

      assert.deepEqual(txm.getTransactions({ limit: 2 }), [
        approvedTx2,
        approvedTx2Dupe,
        failedTx3,
        failedTx3Dupe,
      ]);
    });

    it('returns a tx with the requested data', function () {
      const txMetas = [
        {
          id: 0,
          status: TRANSACTION_STATUSES.UNAPPROVED,
          txParams: { from: VALID_ADDRESS, to: VALID_ADDRESS_TWO },
          metamaskNetworkId: currentNetworkId,
        },
        {
          id: 1,
          status: TRANSACTION_STATUSES.UNAPPROVED,
          txParams: { from: VALID_ADDRESS, to: VALID_ADDRESS_TWO },
          metamaskNetworkId: currentNetworkId,
        },
        {
          id: 2,
          status: TRANSACTION_STATUSES.UNAPPROVED,
          txParams: { from: VALID_ADDRESS, to: VALID_ADDRESS_TWO },
          metamaskNetworkId: currentNetworkId,
        },
        {
          id: 3,
          status: TRANSACTION_STATUSES.UNAPPROVED,
          txParams: { from: VALID_ADDRESS_TWO, to: VALID_ADDRESS },
          metamaskNetworkId: currentNetworkId,
        },
        {
          id: 4,
          status: TRANSACTION_STATUSES.UNAPPROVED,
          txParams: { from: VALID_ADDRESS_TWO, to: VALID_ADDRESS },
          metamaskNetworkId: currentNetworkId,
        },
        {
          id: 5,
          status: TRANSACTION_STATUSES.CONFIRMED,
          txParams: { from: VALID_ADDRESS, to: VALID_ADDRESS_TWO },
          metamaskNetworkId: currentNetworkId,
        },
        {
          id: 6,
          status: TRANSACTION_STATUSES.CONFIRMED,
          txParams: { from: VALID_ADDRESS, to: VALID_ADDRESS_TWO },
          metamaskNetworkId: currentNetworkId,
        },
        {
          id: 7,
          status: TRANSACTION_STATUSES.CONFIRMED,
          txParams: { from: VALID_ADDRESS_TWO, to: VALID_ADDRESS },
          metamaskNetworkId: currentNetworkId,
        },
        {
          id: 8,
          status: TRANSACTION_STATUSES.CONFIRMED,
          txParams: { from: VALID_ADDRESS_TWO, to: VALID_ADDRESS },
          metamaskNetworkId: currentNetworkId,
        },
        {
          id: 9,
          status: TRANSACTION_STATUSES.CONFIRMED,
          txParams: { from: VALID_ADDRESS_TWO, to: VALID_ADDRESS },
          metamaskNetworkId: currentNetworkId,
        },
      ];
      txMetas.forEach((txMeta) => txStateManager.addTransaction(txMeta));
      let searchCriteria;

      searchCriteria = {
        status: TRANSACTION_STATUSES.UNAPPROVED,
        from: VALID_ADDRESS,
      };
      assert.equal(
        txStateManager.getTransactions({ searchCriteria }).length,
        3,
        `getTransactions - ${JSON.stringify(searchCriteria)}`,
      );
      searchCriteria = {
        status: TRANSACTION_STATUSES.UNAPPROVED,
        to: VALID_ADDRESS,
      };
      assert.equal(
        txStateManager.getTransactions({ searchCriteria }).length,
        2,
        `getTransactions - ${JSON.stringify(searchCriteria)}`,
      );
      searchCriteria = {
        status: TRANSACTION_STATUSES.CONFIRMED,
        from: VALID_ADDRESS_TWO,
      };
      assert.equal(
        txStateManager.getTransactions({ searchCriteria }).length,
        3,
        `getTransactions - ${JSON.stringify(searchCriteria)}`,
      );
      searchCriteria = { status: TRANSACTION_STATUSES.CONFIRMED };
      assert.equal(
        txStateManager.getTransactions({ searchCriteria }).length,
        5,
        `getTransactions - ${JSON.stringify(searchCriteria)}`,
      );
      searchCriteria = { from: VALID_ADDRESS };
      assert.equal(
        txStateManager.getTransactions({ searchCriteria }).length,
        5,
        `getTransactions - ${JSON.stringify(searchCriteria)}`,
      );
      searchCriteria = { to: VALID_ADDRESS };
      assert.equal(
        txStateManager.getTransactions({ searchCriteria }).length,
        5,
        `getTransactions - ${JSON.stringify(searchCriteria)}`,
      );
      searchCriteria = {
        status: (status) => status !== TRANSACTION_STATUSES.CONFIRMED,
      };
      assert.equal(
        txStateManager.getTransactions({ searchCriteria }).length,
        5,
        `getTransactions - ${JSON.stringify(searchCriteria)}`,
      );
    });
  });

  describe('#addTransaction', function () {
    it('adds a tx returned in getTransactions', function () {
      const tx = {
        id: 1,
        status: TRANSACTION_STATUSES.CONFIRMED,
        metamaskNetworkId: currentNetworkId,
        txParams: {
          to: VALID_ADDRESS,
          from: VALID_ADDRESS,
        },
      };
      txStateManager.addTransaction(tx);
      const result = txStateManager.getTransactions();
      assert.ok(Array.isArray(result));
      assert.equal(result.length, 1);
      assert.equal(result[0].id, 1);
    });

    it('throws error and does not add tx if txParams are invalid', function () {
      const validTxParams = {
        from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        to: '0x0039f22efb07a647557c7c5d17854cfd6d489ef3',
        nonce: '0x3',
        gas: '0x77359400',
        gasPrice: '0x77359400',
        value: '0x0',
        data: '0x0',
      };
      const invalidValues = [1, true, {}, Symbol('1')];

      Object.keys(validTxParams).forEach((key) => {
        for (const value of invalidValues) {
          const tx = {
            id: 1,
            status: TRANSACTION_STATUSES.UNAPPROVED,
            metamaskNetworkId: currentNetworkId,
            txParams: {
              ...validTxParams,
              [key]: value,
            },
          };
          assert.throws(
            txStateManager.addTransaction.bind(txStateManager, tx),
            'addTransaction should throw error',
          );
          const result = txStateManager.getTransactions();
          assert.ok(Array.isArray(result), 'txList should be an array');
          assert.equal(result.length, 0, 'txList should be empty');
        }
      });
    });

    it('does not override txs from other networks', function () {
      const tx = {
        id: 1,
        status: TRANSACTION_STATUSES.CONFIRMED,
        metamaskNetworkId: currentNetworkId,
        txParams: {
          to: VALID_ADDRESS,
          from: VALID_ADDRESS,
        },
      };
      const tx2 = {
        id: 2,
        status: TRANSACTION_STATUSES.CONFIRMED,
        metamaskNetworkId: otherNetworkId,
        txParams: {
          to: VALID_ADDRESS,
          from: VALID_ADDRESS,
        },
      };
      txStateManager.addTransaction(tx);
      txStateManager.addTransaction(tx2);
      const result = txStateManager.getTransactions({
        filterToCurrentNetwork: false,
      });
      const result2 = txStateManager.getTransactions();
      assert.equal(result.length, 2, 'txs were deleted');
      assert.equal(result2.length, 1, 'incorrect number of txs on network.');
    });

    it('cuts off early txs beyond a limit', function () {
      const limit = txStateManager.txHistoryLimit;
      for (let i = 0; i < limit + 1; i++) {
        const tx = {
          id: i,
          time: new Date(),
          status: TRANSACTION_STATUSES.CONFIRMED,
          metamaskNetworkId: currentNetworkId,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS,
          },
        };
        txStateManager.addTransaction(tx);
      }
      const result = txStateManager.getTransactions();
      assert.equal(result.length, limit, `limit of ${limit} txs enforced`);
      assert.equal(result[0].id, 1, 'early txs truncated');
    });

    it('cuts off early txs beyond a limit whether or not it is confirmed or rejected', function () {
      const limit = txStateManager.txHistoryLimit;
      for (let i = 0; i < limit + 1; i++) {
        const tx = {
          id: i,
          time: new Date(),
          status: TRANSACTION_STATUSES.REJECTED,
          metamaskNetworkId: currentNetworkId,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS,
          },
        };
        txStateManager.addTransaction(tx);
      }
      const result = txStateManager.getTransactions();
      assert.equal(result.length, limit, `limit of ${limit} txs enforced`);
      assert.equal(result[0].id, 1, 'early txs truncated');
    });

    it('cuts off early txs beyond a limit but does not cut unapproved txs', function () {
      const unconfirmedTx = {
        id: 0,
        time: new Date(),
        status: TRANSACTION_STATUSES.UNAPPROVED,
        metamaskNetworkId: currentNetworkId,
        txParams: {
          to: VALID_ADDRESS,
          from: VALID_ADDRESS,
        },
      };
      txStateManager.addTransaction(unconfirmedTx);
      const limit = txStateManager.txHistoryLimit;
      for (let i = 1; i < limit + 1; i++) {
        const tx = {
          id: i,
          time: new Date(),
          status: TRANSACTION_STATUSES.CONFIRMED,
          metamaskNetworkId: currentNetworkId,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS,
          },
        };
        txStateManager.addTransaction(tx);
      }
      const result = txStateManager.getTransactions();
      assert.equal(result.length, limit, `limit of ${limit} txs enforced`);
      assert.equal(result[0].id, 0, 'first tx should still be there');
      assert.equal(
        result[0].status,
        TRANSACTION_STATUSES.UNAPPROVED,
        'first tx should be unapproved',
      );
      assert.equal(result[1].id, 2, 'early txs truncated');
    });
  });

  describe('#updateTransaction', function () {
    it('replaces the tx with the same id', function () {
      txStateManager.addTransaction({
        id: '1',
        status: TRANSACTION_STATUSES.UNAPPROVED,
        metamaskNetworkId: currentNetworkId,
        txParams: {
          to: VALID_ADDRESS,
          from: VALID_ADDRESS,
        },
      });
      txStateManager.addTransaction({
        id: '2',
        status: TRANSACTION_STATUSES.CONFIRMED,
        metamaskNetworkId: currentNetworkId,
        txParams: {
          to: VALID_ADDRESS,
          from: VALID_ADDRESS,
        },
      });
      const txMeta = txStateManager.getTransaction('1');
      txMeta.hash = 'foo';
      txStateManager.updateTransaction(txMeta);
      const result = txStateManager.getTransaction('1');
      assert.equal(result.hash, 'foo');
    });

    it('throws error and does not update tx if txParams are invalid', function () {
      const validTxParams = {
        from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        to: '0x0039f22efb07a647557c7c5d17854cfd6d489ef3',
        nonce: '0x3',
        gas: '0x77359400',
        gasPrice: '0x77359400',
        value: '0x0',
        data: '0x0',
      };
      const invalidValues = [1, true, {}, Symbol('1')];

      txStateManager.addTransaction({
        id: 1,
        status: TRANSACTION_STATUSES.UNAPPROVED,
        metamaskNetworkId: currentNetworkId,
        txParams: validTxParams,
      });

      Object.keys(validTxParams).forEach((key) => {
        for (const value of invalidValues) {
          const originalTx = txStateManager.getTransaction(1);
          const newTx = {
            ...originalTx,
            txParams: {
              ...originalTx.txParams,
              [key]: value,
            },
          };
          assert.throws(
            txStateManager.updateTransaction.bind(txStateManager, newTx),
            'updateTransaction should throw an error',
          );
          const result = txStateManager.getTransaction(1);
          assert.deepEqual(result, originalTx, 'tx should not be updated');
        }
      });
    });

    it('updates gas price and adds history items', function () {
      const originalGasPrice = '0x01';
      const desiredGasPrice = '0x02';

      const txMeta = {
        id: '1',
        status: TRANSACTION_STATUSES.UNAPPROVED,
        metamaskNetworkId: currentNetworkId,
        txParams: {
          from: VALID_ADDRESS_TWO,
          to: VALID_ADDRESS,
          gasPrice: originalGasPrice,
        },
      };

      txStateManager.addTransaction(txMeta);
      const updatedTx = txStateManager.getTransaction('1');
      // verify tx was initialized correctly
      assert.equal(updatedTx.history.length, 1, 'one history item (initial)');
      assert.equal(
        Array.isArray(updatedTx.history[0]),
        false,
        'first history item is initial state',
      );
      assert.deepEqual(
        updatedTx.history[0],
        snapshotFromTxMeta(updatedTx),
        'first history item is initial state',
      );
      // modify value and updateTransaction
      updatedTx.txParams.gasPrice = desiredGasPrice;
      const before = new Date().getTime();
      txStateManager.updateTransaction(updatedTx);
      const after = new Date().getTime();
      // check updated value
      const result = txStateManager.getTransaction('1');
      assert.equal(
        result.txParams.gasPrice,
        desiredGasPrice,
        'gas price updated',
      );
      // validate history was updated
      assert.equal(
        result.history.length,
        2,
        'two history items (initial + diff)',
      );
      assert.equal(
        result.history[1].length,
        1,
        'two history state items (initial + diff)',
      );

      const expectedEntry = {
        op: 'replace',
        path: '/txParams/gasPrice',
        value: desiredGasPrice,
      };
      assert.deepEqual(
        result.history[1][0].op,
        expectedEntry.op,
        'two history items (initial + diff) operation',
      );
      assert.deepEqual(
        result.history[1][0].path,
        expectedEntry.path,
        'two history items (initial + diff) path',
      );
      assert.deepEqual(
        result.history[1][0].value,
        expectedEntry.value,
        'two history items (initial + diff) value',
      );
      assert.ok(
        result.history[1][0].timestamp >= before &&
          result.history[1][0].timestamp <= after,
      );
    });

    it('does NOT add empty history items', function () {
      const txMeta = {
        id: '1',
        status: TRANSACTION_STATUSES.UNAPPROVED,
        metamaskNetworkId: currentNetworkId,
        txParams: {
          from: VALID_ADDRESS_TWO,
          to: VALID_ADDRESS,
          gasPrice: '0x01',
        },
      };

      txStateManager.addTransaction(txMeta);
      txStateManager.updateTransaction(txMeta);

      const { history } = txStateManager.getTransaction('1');
      assert.equal(history.length, 1, 'two history items (initial + diff)');
    });
  });

  describe('#getUnapprovedTxList', function () {
    it('returns unapproved txs in a hash', function () {
      txStateManager.addTransaction({
        id: '1',
        status: TRANSACTION_STATUSES.UNAPPROVED,
        metamaskNetworkId: currentNetworkId,
        txParams: {
          to: VALID_ADDRESS,
          from: VALID_ADDRESS,
        },
      });
      txStateManager.addTransaction({
        id: '2',
        status: TRANSACTION_STATUSES.CONFIRMED,
        metamaskNetworkId: currentNetworkId,
        txParams: {
          to: VALID_ADDRESS,
          from: VALID_ADDRESS,
        },
      });
      const result = txStateManager.getUnapprovedTxList();
      assert.equal(typeof result, 'object');
      assert.equal(result['1'].status, TRANSACTION_STATUSES.UNAPPROVED);
      assert.equal(result['2'], undefined);
    });
  });

  describe('#getTransaction', function () {
    it('returns a tx with the requested id', function () {
      txStateManager.addTransaction({
        id: '1',
        status: TRANSACTION_STATUSES.UNAPPROVED,
        metamaskNetworkId: currentNetworkId,
        txParams: {
          to: VALID_ADDRESS,
          from: VALID_ADDRESS,
        },
      });
      txStateManager.addTransaction({
        id: '2',
        status: TRANSACTION_STATUSES.CONFIRMED,
        metamaskNetworkId: currentNetworkId,
        txParams: {
          to: VALID_ADDRESS,
          from: VALID_ADDRESS,
        },
      });
      assert.equal(
        txStateManager.getTransaction('1').status,
        TRANSACTION_STATUSES.UNAPPROVED,
      );
      assert.equal(
        txStateManager.getTransaction('2').status,
        TRANSACTION_STATUSES.CONFIRMED,
      );
    });
  });

  describe('#wipeTransactions', function () {
    const specificAddress = VALID_ADDRESS;
    const otherAddress = VALID_ADDRESS_TWO;

    it('should remove only the transactions from a specific address', function () {
      const txMetas = [
        {
          id: 0,
          status: TRANSACTION_STATUSES.UNAPPROVED,
          txParams: { from: specificAddress, to: otherAddress },
          metamaskNetworkId: currentNetworkId,
        },
        {
          id: 1,
          status: TRANSACTION_STATUSES.CONFIRMED,
          txParams: { from: otherAddress, to: specificAddress },
          metamaskNetworkId: currentNetworkId,
        },
        {
          id: 2,
          status: TRANSACTION_STATUSES.CONFIRMED,
          txParams: { from: otherAddress, to: specificAddress },
          metamaskNetworkId: currentNetworkId,
        },
      ];
      txMetas.forEach((txMeta) => txStateManager.addTransaction(txMeta));

      txStateManager.wipeTransactions(specificAddress);

      const transactionsFromCurrentAddress = txStateManager
        .getTransactions()
        .filter((txMeta) => txMeta.txParams.from === specificAddress);
      const transactionsFromOtherAddresses = txStateManager
        .getTransactions()
        .filter((txMeta) => txMeta.txParams.from !== specificAddress);

      assert.equal(transactionsFromCurrentAddress.length, 0);
      assert.equal(transactionsFromOtherAddresses.length, 2);
    });

    it('should not remove the transactions from other networks', function () {
      const txMetas = [
        {
          id: 0,
          status: TRANSACTION_STATUSES.UNAPPROVED,
          txParams: { from: specificAddress, to: otherAddress },
          metamaskNetworkId: currentNetworkId,
        },
        {
          id: 1,
          status: TRANSACTION_STATUSES.CONFIRMED,
          txParams: { from: specificAddress, to: otherAddress },
          metamaskNetworkId: otherNetworkId,
        },
        {
          id: 2,
          status: TRANSACTION_STATUSES.CONFIRMED,
          txParams: { from: specificAddress, to: otherAddress },
          metamaskNetworkId: otherNetworkId,
        },
      ];

      txMetas.forEach((txMeta) => txStateManager.addTransaction(txMeta));

      txStateManager.wipeTransactions(specificAddress);

      const txsFromCurrentNetworkAndAddress = txStateManager
        .getTransactions()
        .filter((txMeta) => txMeta.txParams.from === specificAddress);
      const txFromOtherNetworks = txStateManager
        .getTransactions({ filterToCurrentNetwork: false })
        .filter((txMeta) => txMeta.metamaskNetworkId === otherNetworkId);

      assert.equal(txsFromCurrentNetworkAndAddress.length, 0);
      assert.equal(txFromOtherNetworks.length, 2);
    });
  });

  describe('#_deleteTransaction', function () {
    it('should remove the transaction from the storage', function () {
      txStateManager.addTransaction({ id: 1 });
      txStateManager._deleteTransaction(1);
      assert.ok(
        !txStateManager.getTransactions({ filterToCurrentNetwork: false })
          .length,
        'txList should be empty',
      );
    });

    it('should only remove the transaction with ID 1 from the storage', function () {
      txStateManager.store.updateState({
        transactions: { 1: { id: 1 }, 2: { id: 2 } },
      });
      txStateManager._deleteTransaction(1);
      assert.equal(
        txStateManager.getTransactions({
          filterToCurrentNetwork: false,
        })[0].id,
        2,
        'txList should have a id of 2',
      );
    });
  });

  describe('#clearUnapprovedTxs', function () {
    it('removes unapproved transactions', function () {
      const txMetas = [
        {
          id: 0,
          status: TRANSACTION_STATUSES.UNAPPROVED,
          txParams: { from: VALID_ADDRESS, to: VALID_ADDRESS_TWO },
          metamaskNetworkId: currentNetworkId,
        },
        {
          id: 1,
          status: TRANSACTION_STATUSES.UNAPPROVED,
          txParams: { from: VALID_ADDRESS, to: VALID_ADDRESS_TWO },
          metamaskNetworkId: currentNetworkId,
        },
        {
          id: 2,
          status: TRANSACTION_STATUSES.CONFIRMED,
          txParams: { from: VALID_ADDRESS, to: VALID_ADDRESS_TWO },
          metamaskNetworkId: otherNetworkId,
        },
        {
          id: 3,
          status: TRANSACTION_STATUSES.CONFIRMED,
          txParams: { from: VALID_ADDRESS, to: VALID_ADDRESS_TWO },
          metamaskNetworkId: otherNetworkId,
        },
      ];

      txMetas.forEach((txMeta) => txStateManager.addTransaction(txMeta));

      txStateManager.clearUnapprovedTxs();

      const unapprovedTxList = txStateManager
        .getTransactions({ filterToCurrentNetwork: false })
        .filter((tx) => tx.status === TRANSACTION_STATUSES.UNAPPROVED);

      assert.equal(unapprovedTxList.length, 0);
    });
  });
});
