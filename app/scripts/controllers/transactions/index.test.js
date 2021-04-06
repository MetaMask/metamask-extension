import { strict as assert } from 'assert';
import EventEmitter from 'events';
import ethUtil from 'ethereumjs-util';
import EthTx from 'ethereumjs-tx';
import { ObservableStore } from '@metamask/obs-store';
import sinon from 'sinon';

import {
  createTestProviderTools,
  getTestAccounts,
} from '../../../../test/stub/provider';
import {
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
} from '../../../../shared/constants/transaction';
import { METAMASK_CONTROLLER_EVENTS } from '../../metamask-controller';
import TransactionController from '.';

const noop = () => true;
const currentNetworkId = '42';
const currentChainId = '0x2a';

const VALID_ADDRESS = '0x0000000000000000000000000000000000000000';
const VALID_ADDRESS_TWO = '0x0000000000000000000000000000000000000001';

describe('Transaction Controller', function () {
  let txController, provider, providerResultStub, fromAccount;

  beforeEach(function () {
    providerResultStub = {
      // 1 gwei
      eth_gasPrice: '0x0de0b6b3a7640000',
      // by default, all accounts are external accounts (not contracts)
      eth_getCode: '0x',
    };
    provider = createTestProviderTools({ scaffold: providerResultStub })
      .provider;
    fromAccount = getTestAccounts()[0];
    const blockTrackerStub = new EventEmitter();
    blockTrackerStub.getCurrentBlock = noop;
    blockTrackerStub.getLatestBlock = noop;
    txController = new TransactionController({
      provider,
      getGasPrice() {
        return '0xee6b2800';
      },
      networkStore: new ObservableStore(currentNetworkId),
      txHistoryLimit: 10,
      blockTracker: blockTrackerStub,
      signTransaction: (ethTx) =>
        new Promise((resolve) => {
          ethTx.sign(fromAccount.key);
          resolve();
        }),
      getPermittedAccounts: () => undefined,
      getCurrentChainId: () => currentChainId,
      getParticipateInMetrics: () => false,
    });
    txController.nonceTracker.getNonceLock = () =>
      Promise.resolve({ nextNonce: 0, releaseLock: noop });
  });

  describe('#getState', function () {
    it('should return a state object with the right keys and data types', function () {
      const exposedState = txController.getState();
      assert.ok(
        'unapprovedTxs' in exposedState,
        'state should have the key unapprovedTxs',
      );
      assert.ok(
        'currentNetworkTxList' in exposedState,
        'state should have the key currentNetworkTxList',
      );
      assert.ok(
        typeof exposedState?.unapprovedTxs === 'object',
        'should be an object',
      );
      assert.ok(
        Array.isArray(exposedState.currentNetworkTxList),
        'should be an array',
      );
    });
  });

  describe('#getUnapprovedTxCount', function () {
    it('should return the number of unapproved txs', function () {
      txController.txStateManager._addTransactionsToState([
        {
          id: 1,
          status: TRANSACTION_STATUSES.UNAPPROVED,
          metamaskNetworkId: currentNetworkId,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          history: [{}],
        },
        {
          id: 2,
          status: TRANSACTION_STATUSES.UNAPPROVED,
          metamaskNetworkId: currentNetworkId,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          history: [{}],
        },
        {
          id: 3,
          status: TRANSACTION_STATUSES.UNAPPROVED,
          metamaskNetworkId: currentNetworkId,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          history: [{}],
        },
      ]);
      const unapprovedTxCount = txController.getUnapprovedTxCount();
      assert.equal(unapprovedTxCount, 3, 'should be 3');
    });
  });

  describe('#getPendingTxCount', function () {
    it('should return the number of pending txs', function () {
      txController.txStateManager._addTransactionsToState([
        {
          id: 1,
          status: TRANSACTION_STATUSES.SUBMITTED,
          metamaskNetworkId: currentNetworkId,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          history: [{}],
        },
        {
          id: 2,
          status: TRANSACTION_STATUSES.SUBMITTED,
          metamaskNetworkId: currentNetworkId,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          history: [{}],
        },
        {
          id: 3,
          status: TRANSACTION_STATUSES.SUBMITTED,
          metamaskNetworkId: currentNetworkId,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          history: [{}],
        },
      ]);
      const pendingTxCount = txController.getPendingTxCount();
      assert.equal(pendingTxCount, 3, 'should be 3');
    });
  });

  describe('#getConfirmedTransactions', function () {
    it('should return the number of confirmed txs', function () {
      const address = '0xc684832530fcbddae4b4230a47e991ddcec2831d';
      const txParams = {
        from: address,
        to: '0xc684832530fcbddae4b4230a47e991ddcec2831d',
      };
      txController.txStateManager._addTransactionsToState([
        {
          id: 0,
          status: TRANSACTION_STATUSES.CONFIRMED,
          metamaskNetworkId: currentNetworkId,
          txParams,
          history: [{}],
        },
        {
          id: 1,
          status: TRANSACTION_STATUSES.CONFIRMED,
          metamaskNetworkId: currentNetworkId,
          txParams,
          history: [{}],
        },
        {
          id: 2,
          status: TRANSACTION_STATUSES.CONFIRMED,
          metamaskNetworkId: currentNetworkId,
          txParams,
          history: [{}],
        },
        {
          id: 3,
          status: TRANSACTION_STATUSES.UNAPPROVED,
          metamaskNetworkId: currentNetworkId,
          txParams,
          history: [{}],
        },
        {
          id: 4,
          status: TRANSACTION_STATUSES.REJECTED,
          metamaskNetworkId: currentNetworkId,
          txParams,
          history: [{}],
        },
        {
          id: 5,
          status: TRANSACTION_STATUSES.APPROVED,
          metamaskNetworkId: currentNetworkId,
          txParams,
          history: [{}],
        },
        {
          id: 6,
          status: TRANSACTION_STATUSES.SIGNED,
          metamaskNetworkId: currentNetworkId,
          txParams,
          history: [{}],
        },
        {
          id: 7,
          status: TRANSACTION_STATUSES.SUBMITTED,
          metamaskNetworkId: currentNetworkId,
          txParams,
          history: [{}],
        },
        {
          id: 8,
          status: TRANSACTION_STATUSES.FAILED,
          metamaskNetworkId: currentNetworkId,
          txParams,
          history: [{}],
        },
      ]);
      assert.equal(
        txController.nonceTracker.getConfirmedTransactions(address).length,
        3,
      );
    });
  });

  describe('#newUnapprovedTransaction', function () {
    let stub, txMeta, txParams;
    beforeEach(function () {
      txParams = {
        from: '0xc684832530fcbddae4b4230a47e991ddcec2831d',
        to: '0xc684832530fcbddae4b4230a47e991ddcec2831d',
      };
      txMeta = {
        status: TRANSACTION_STATUSES.UNAPPROVED,
        id: 1,
        metamaskNetworkId: currentNetworkId,
        txParams,
        history: [{}],
      };
      txController.txStateManager._addTransactionsToState([txMeta]);
      stub = sinon
        .stub(txController, 'addUnapprovedTransaction')
        .callsFake(() => {
          txController.emit('newUnapprovedTx', txMeta);
          return Promise.resolve(
            txController.txStateManager.addTransaction(txMeta),
          );
        });
    });

    afterEach(function () {
      txController.txStateManager._addTransactionsToState([]);
      stub.restore();
    });

    it('should resolve when finished and status is submitted and resolve with the hash', async function () {
      txController.once('newUnapprovedTx', (txMetaFromEmit) => {
        setTimeout(() => {
          txController.setTxHash(txMetaFromEmit.id, '0x0');
          txController.txStateManager.setTxStatusSubmitted(txMetaFromEmit.id);
        });
      });

      const hash = await txController.newUnapprovedTransaction(txParams);
      assert.ok(hash, 'newUnapprovedTransaction needs to return the hash');
    });

    it('should reject when finished and status is rejected', async function () {
      txController.once('newUnapprovedTx', (txMetaFromEmit) => {
        setTimeout(() => {
          txController.txStateManager.setTxStatusRejected(txMetaFromEmit.id);
        });
      });

      await assert.rejects(
        () => txController.newUnapprovedTransaction(txParams),
        {
          message: 'MetaMask Tx Signature: User denied transaction signature.',
        },
      );
    });
  });

  describe('#addUnapprovedTransaction', function () {
    const selectedAddress = '0x1678a085c290ebd122dc42cba69373b5953b831d';
    const recipientAddress = '0xc42edfcc21ed14dda456aa0756c153f7985d8813';

    let getSelectedAddress, getPermittedAccounts;
    beforeEach(function () {
      getSelectedAddress = sinon
        .stub(txController, 'getSelectedAddress')
        .returns(selectedAddress);
      getPermittedAccounts = sinon
        .stub(txController, 'getPermittedAccounts')
        .returns([selectedAddress]);
    });

    afterEach(function () {
      getSelectedAddress.restore();
      getPermittedAccounts.restore();
    });

    it('should add an unapproved transaction and return a valid txMeta', async function () {
      const txMeta = await txController.addUnapprovedTransaction({
        from: selectedAddress,
        to: recipientAddress,
      });
      assert.ok('id' in txMeta, 'should have a id');
      assert.ok('time' in txMeta, 'should have a time stamp');
      assert.ok(
        'metamaskNetworkId' in txMeta,
        'should have a metamaskNetworkId',
      );
      assert.ok('txParams' in txMeta, 'should have a txParams');
      assert.ok('history' in txMeta, 'should have a history');
      assert.equal(
        txMeta.txParams.value,
        '0x0',
        'should have added 0x0 as the value',
      );

      const memTxMeta = txController.txStateManager.getTransaction(txMeta.id);
      assert.deepEqual(txMeta, memTxMeta);
    });

    it('should emit newUnapprovedTx event and pass txMeta as the first argument', function (done) {
      providerResultStub.eth_gasPrice = '4a817c800';
      txController.once('newUnapprovedTx', (txMetaFromEmit) => {
        assert.ok(txMetaFromEmit, 'txMeta is falsy');
        done();
      });
      txController
        .addUnapprovedTransaction({
          from: selectedAddress,
          to: recipientAddress,
        })
        .catch(done);
    });

    it("should fail if the from address isn't the selected address", async function () {
      await assert.rejects(() =>
        txController.addUnapprovedTransaction({
          from: '0x0d1d4e623D10F9FBA5Db95830F7d3839406C6AF2',
        }),
      );
    });

    it('should fail if netId is loading', async function () {
      txController.networkStore = new ObservableStore('loading');
      await assert.rejects(
        () =>
          txController.addUnapprovedTransaction({
            from: selectedAddress,
            to: '0x0d1d4e623D10F9FBA5Db95830F7d3839406C6AF2',
          }),
        { message: 'MetaMask is having trouble connecting to the network' },
      );
    });
  });

  describe('#addTxGasDefaults', function () {
    it('should add the tx defaults if their are none', async function () {
      txController.txStateManager._addTransactionsToState([
        {
          id: 1,
          status: TRANSACTION_STATUSES.UNAPPROVED,
          metamaskNetworkId: currentNetworkId,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          history: [{}],
        },
      ]);
      const txMeta = {
        id: 1,
        txParams: {
          from: '0xc684832530fcbddae4b4230a47e991ddcec2831d',
          to: '0xc684832530fcbddae4b4230a47e991ddcec2831d',
        },
        history: [{}],
      };
      providerResultStub.eth_gasPrice = '4a817c800';
      providerResultStub.eth_getBlockByNumber = { gasLimit: '47b784' };
      providerResultStub.eth_estimateGas = '5209';

      const txMetaWithDefaults = await txController.addTxGasDefaults(txMeta);
      assert.ok(
        txMetaWithDefaults.txParams.gasPrice,
        'should have added the gas price',
      );
      assert.ok(
        txMetaWithDefaults.txParams.gas,
        'should have added the gas field',
      );
    });
  });

  describe('#addTransaction', function () {
    it('should emit updates', function (done) {
      const txMeta = {
        id: '1',
        status: TRANSACTION_STATUSES.UNAPPROVED,
        metamaskNetworkId: currentNetworkId,
        txParams: {
          to: VALID_ADDRESS,
          from: VALID_ADDRESS_TWO,
        },
      };

      const eventNames = [
        METAMASK_CONTROLLER_EVENTS.UPDATE_BADGE,
        '1:unapproved',
      ];
      const listeners = [];
      eventNames.forEach((eventName) => {
        listeners.push(
          new Promise((resolve) => {
            txController.once(eventName, (arg) => {
              resolve(arg);
            });
          }),
        );
      });
      Promise.all(listeners)
        .then((returnValues) => {
          assert.deepEqual(
            returnValues.pop(),
            txMeta,
            'last event 1:unapproved should return txMeta',
          );
          done();
        })
        .catch(done);
      txController.addTransaction(txMeta);
    });
  });

  describe('#approveTransaction', function () {
    it('does not overwrite set values', async function () {
      const originalValue = '0x01';
      const txMeta = {
        id: '1',
        status: TRANSACTION_STATUSES.UNAPPROVED,
        metamaskNetworkId: currentNetworkId,
        txParams: {
          to: VALID_ADDRESS_TWO,
          from: VALID_ADDRESS,
          nonce: originalValue,
          gas: originalValue,
          gasPrice: originalValue,
        },
      };
      // eslint-disable-next-line @babel/no-invalid-this
      this.timeout(15000);
      const wrongValue = '0x05';

      txController.addTransaction(txMeta);
      providerResultStub.eth_gasPrice = wrongValue;
      providerResultStub.eth_estimateGas = '0x5209';

      const signStub = sinon
        .stub(txController, 'signTransaction')
        .callsFake(() => Promise.resolve());

      const pubStub = sinon
        .stub(txController, 'publishTransaction')
        .callsFake(() => {
          txController.setTxHash('1', originalValue);
          txController.txStateManager.setTxStatusSubmitted('1');
        });

      await txController.approveTransaction(txMeta.id);
      const result = txController.txStateManager.getTransaction(txMeta.id);
      const params = result.txParams;

      assert.equal(params.gas, originalValue, 'gas unmodified');
      assert.equal(params.gasPrice, originalValue, 'gas price unmodified');
      assert.equal(result.hash, originalValue);
      assert.equal(
        result.status,
        TRANSACTION_STATUSES.SUBMITTED,
        'should have reached the submitted status.',
      );
      signStub.restore();
      pubStub.restore();
    });
  });

  describe('#sign replay-protected tx', function () {
    it('prepares a tx with the chainId set', async function () {
      txController.addTransaction(
        {
          id: '1',
          status: TRANSACTION_STATUSES.UNAPPROVED,
          metamaskNetworkId: currentNetworkId,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
        },
        noop,
      );
      const rawTx = await txController.signTransaction('1');
      const ethTx = new EthTx(ethUtil.toBuffer(rawTx));
      assert.equal(ethTx.getChainId(), 42);
    });
  });

  describe('#updateAndApproveTransaction', function () {
    it('should update and approve transactions', async function () {
      const txMeta = {
        id: 1,
        status: TRANSACTION_STATUSES.UNAPPROVED,
        txParams: {
          from: fromAccount.address,
          to: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          gasPrice: '0x77359400',
          gas: '0x7b0d',
          nonce: '0x4b',
        },
        metamaskNetworkId: currentNetworkId,
      };
      txController.txStateManager.addTransaction(txMeta);
      const approvalPromise = txController.updateAndApproveTransaction(txMeta);
      const tx = txController.txStateManager.getTransaction(1);
      assert.equal(tx.status, TRANSACTION_STATUSES.APPROVED);
      await approvalPromise;
    });
  });

  describe('#getChainId', function () {
    it('returns 0 when the chainId is NaN', function () {
      txController.networkStore = new ObservableStore('loading');
      assert.equal(txController.getChainId(), 0);
    });
  });

  describe('#cancelTransaction', function () {
    it('should emit a status change to rejected', function (done) {
      txController.txStateManager._addTransactionsToState([
        {
          id: 0,
          status: TRANSACTION_STATUSES.UNAPPROVED,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          metamaskNetworkId: currentNetworkId,
          history: [{}],
        },
        {
          id: 1,
          status: TRANSACTION_STATUSES.REJECTED,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          metamaskNetworkId: currentNetworkId,
          history: [{}],
        },
        {
          id: 2,
          status: TRANSACTION_STATUSES.APPROVED,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          metamaskNetworkId: currentNetworkId,
          history: [{}],
        },
        {
          id: 3,
          status: TRANSACTION_STATUSES.SIGNED,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          metamaskNetworkId: currentNetworkId,
          history: [{}],
        },
        {
          id: 4,
          status: TRANSACTION_STATUSES.SUBMITTED,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          metamaskNetworkId: currentNetworkId,
          history: [{}],
        },
        {
          id: 5,
          status: TRANSACTION_STATUSES.CONFIRMED,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          metamaskNetworkId: currentNetworkId,
          history: [{}],
        },
        {
          id: 6,
          status: TRANSACTION_STATUSES.FAILED,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          metamaskNetworkId: currentNetworkId,
          history: [{}],
        },
      ]);

      txController.once('tx:status-update', (txId, status) => {
        try {
          assert.equal(
            status,
            TRANSACTION_STATUSES.REJECTED,
            'status should be rejected',
          );
          assert.equal(txId, 0, 'id should e 0');
          done();
        } catch (e) {
          done(e);
        }
      });

      txController.cancelTransaction(0);
    });
  });

  describe('#createSpeedUpTransaction', function () {
    let addTransactionSpy;
    let approveTransactionSpy;
    let txParams;
    let expectedTxParams;

    beforeEach(function () {
      addTransactionSpy = sinon.spy(txController, 'addTransaction');
      approveTransactionSpy = sinon.spy(txController, 'approveTransaction');

      txParams = {
        nonce: '0x00',
        from: '0xB09d8505E1F4EF1CeA089D47094f5DD3464083d4',
        to: '0xB09d8505E1F4EF1CeA089D47094f5DD3464083d4',
        gas: '0x5209',
        gasPrice: '0xa',
      };
      txController.txStateManager._addTransactionsToState([
        {
          id: 1,
          status: TRANSACTION_STATUSES.SUBMITTED,
          metamaskNetworkId: currentNetworkId,
          txParams,
          history: [{}],
        },
      ]);

      expectedTxParams = { ...txParams, gasPrice: '0xb' };
    });

    afterEach(function () {
      addTransactionSpy.restore();
      approveTransactionSpy.restore();
    });

    it('should call this.addTransaction and this.approveTransaction with the expected args', async function () {
      await txController.createSpeedUpTransaction(1);
      assert.equal(addTransactionSpy.callCount, 1);

      const addTransactionArgs = addTransactionSpy.getCall(0).args[0];
      assert.deepEqual(addTransactionArgs.txParams, expectedTxParams);

      const { lastGasPrice, type } = addTransactionArgs;
      assert.deepEqual(
        { lastGasPrice, type },
        {
          lastGasPrice: '0xa',
          type: TRANSACTION_TYPES.RETRY,
        },
      );
    });

    it('should call this.approveTransaction with the id of the returned tx', async function () {
      const result = await txController.createSpeedUpTransaction(1);
      assert.equal(approveTransactionSpy.callCount, 1);

      const approveTransactionArg = approveTransactionSpy.getCall(0).args[0];
      assert.equal(result.id, approveTransactionArg);
    });

    it('should return the expected txMeta', async function () {
      const result = await txController.createSpeedUpTransaction(1);

      assert.deepEqual(result.txParams, expectedTxParams);

      const { lastGasPrice, type } = result;
      assert.deepEqual(
        { lastGasPrice, type },
        {
          lastGasPrice: '0xa',
          type: TRANSACTION_TYPES.RETRY,
        },
      );
    });
  });

  describe('#publishTransaction', function () {
    let hash, txMeta;
    beforeEach(function () {
      hash =
        '0x2a5523c6fa98b47b7d9b6c8320179785150b42a16bcff36b398c5062b65657e8';
      txMeta = {
        id: 1,
        status: TRANSACTION_STATUSES.UNAPPROVED,
        txParams: {
          to: VALID_ADDRESS,
          from: VALID_ADDRESS_TWO,
        },
        metamaskNetworkId: currentNetworkId,
      };
      providerResultStub.eth_sendRawTransaction = hash;
    });

    it('should publish a tx, updates the rawTx when provided a one', async function () {
      const rawTx =
        '0x477b2e6553c917af0db0388ae3da62965ff1a184558f61b749d1266b2e6d024c';
      txController.txStateManager.addTransaction(txMeta);
      await txController.publishTransaction(txMeta.id, rawTx);
      const publishedTx = txController.txStateManager.getTransaction(1);
      assert.equal(publishedTx.hash, hash);
      assert.equal(publishedTx.status, TRANSACTION_STATUSES.SUBMITTED);
    });

    it('should ignore the error "Transaction Failed: known transaction" and be as usual', async function () {
      providerResultStub.eth_sendRawTransaction = async (_, __, ___, end) => {
        end('Transaction Failed: known transaction');
      };
      const rawTx =
        '0xf86204831e848082520894f231d46dd78806e1dd93442cf33c7671f853874880802ca05f973e540f2d3c2f06d3725a626b75247593cb36477187ae07ecfe0a4db3cf57a00259b52ee8c58baaa385fb05c3f96116e58de89bcc165cb3bfdfc708672fed8a';
      txController.txStateManager.addTransaction(txMeta);
      await txController.publishTransaction(txMeta.id, rawTx);
      const publishedTx = txController.txStateManager.getTransaction(1);
      assert.equal(
        publishedTx.hash,
        '0x2cc5a25744486f7383edebbf32003e5a66e18135799593d6b5cdd2bb43674f09',
      );
      assert.equal(publishedTx.status, TRANSACTION_STATUSES.SUBMITTED);
    });
  });

  describe('#_markNonceDuplicatesDropped', function () {
    it('should mark all nonce duplicates as dropped without marking the confirmed transaction as dropped', function () {
      txController.txStateManager._addTransactionsToState([
        {
          id: 1,
          status: TRANSACTION_STATUSES.CONFIRMED,
          metamaskNetworkId: currentNetworkId,
          history: [{}],
          txParams: {
            to: VALID_ADDRESS_TWO,
            from: VALID_ADDRESS,
            nonce: '0x01',
          },
        },
        {
          id: 2,
          status: TRANSACTION_STATUSES.SUBMITTED,
          metamaskNetworkId: currentNetworkId,
          history: [{}],
          txParams: {
            to: VALID_ADDRESS_TWO,
            from: VALID_ADDRESS,
            nonce: '0x01',
          },
        },
        {
          id: 3,
          status: TRANSACTION_STATUSES.SUBMITTED,
          metamaskNetworkId: currentNetworkId,
          history: [{}],
          txParams: {
            to: VALID_ADDRESS_TWO,
            from: VALID_ADDRESS,
            nonce: '0x01',
          },
        },
        {
          id: 4,
          status: TRANSACTION_STATUSES.SUBMITTED,
          metamaskNetworkId: currentNetworkId,
          history: [{}],
          txParams: {
            to: VALID_ADDRESS_TWO,
            from: VALID_ADDRESS,
            nonce: '0x01',
          },
        },
        {
          id: 5,
          status: TRANSACTION_STATUSES.SUBMITTED,
          metamaskNetworkId: currentNetworkId,
          history: [{}],
          txParams: {
            to: VALID_ADDRESS_TWO,
            from: VALID_ADDRESS,
            nonce: '0x01',
          },
        },
        {
          id: 6,
          status: TRANSACTION_STATUSES.SUBMITTED,
          metamaskNetworkId: currentNetworkId,
          history: [{}],
          txParams: {
            to: VALID_ADDRESS_TWO,
            from: VALID_ADDRESS,
            nonce: '0x01',
          },
        },
        {
          id: 7,
          status: TRANSACTION_STATUSES.SUBMITTED,
          metamaskNetworkId: currentNetworkId,
          history: [{}],
          txParams: {
            to: VALID_ADDRESS_TWO,
            from: VALID_ADDRESS,
            nonce: '0x01',
          },
        },
      ]);
      txController._markNonceDuplicatesDropped(1);
      const confirmedTx = txController.txStateManager.getTransaction(1);
      const droppedTxs = txController.txStateManager.getTransactions({
        searchCriteria: {
          nonce: '0x01',
          status: TRANSACTION_STATUSES.DROPPED,
        },
      });
      assert.equal(
        confirmedTx.status,
        TRANSACTION_STATUSES.CONFIRMED,
        'the confirmedTx should remain confirmed',
      );
      assert.equal(droppedTxs.length, 6, 'their should be 6 dropped txs');
    });
  });

  describe('#_determineTransactionType', function () {
    it('should return a simple send type when to is truthy but data is falsy', async function () {
      const result = await txController._determineTransactionType({
        to: '0xabc',
        data: '',
      });
      assert.deepEqual(result, {
        type: TRANSACTION_TYPES.SENT_ETHER,
        getCodeResponse: null,
      });
    });

    it('should return a token transfer type when data is for the respective method call', async function () {
      const result = await txController._determineTransactionType({
        to: '0xabc',
        data:
          '0xa9059cbb0000000000000000000000002f318C334780961FB129D2a6c30D0763d9a5C970000000000000000000000000000000000000000000000000000000000000000a',
      });
      assert.deepEqual(result, {
        type: TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER,
        getCodeResponse: undefined,
      });
    });

    it('should return a token approve type when data is for the respective method call', async function () {
      const result = await txController._determineTransactionType({
        to: '0xabc',
        data:
          '0x095ea7b30000000000000000000000002f318C334780961FB129D2a6c30D0763d9a5C9700000000000000000000000000000000000000000000000000000000000000005',
      });
      assert.deepEqual(result, {
        type: TRANSACTION_TYPES.TOKEN_METHOD_APPROVE,
        getCodeResponse: undefined,
      });
    });

    it('should return a contract deployment type when to is falsy and there is data', async function () {
      const result = await txController._determineTransactionType({
        to: '',
        data: '0xabd',
      });
      assert.deepEqual(result, {
        type: TRANSACTION_TYPES.DEPLOY_CONTRACT,
        getCodeResponse: undefined,
      });
    });

    it('should return a simple send type with a 0x getCodeResponse when there is data and but the to address is not a contract address', async function () {
      const result = await txController._determineTransactionType({
        to: '0x9e673399f795D01116e9A8B2dD2F156705131ee9',
        data: '0xabd',
      });
      assert.deepEqual(result, {
        type: TRANSACTION_TYPES.SENT_ETHER,
        getCodeResponse: '0x',
      });
    });

    it('should return a simple send type with a null getCodeResponse when to is truthy and there is data and but getCode returns an error', async function () {
      const result = await txController._determineTransactionType({
        to: '0xabc',
        data: '0xabd',
      });
      assert.deepEqual(result, {
        type: TRANSACTION_TYPES.SENT_ETHER,
        getCodeResponse: null,
      });
    });

    it('should return a contract interaction type with the correct getCodeResponse when to is truthy and there is data and it is not a token transaction', async function () {
      const _providerResultStub = {
        // 1 gwei
        eth_gasPrice: '0x0de0b6b3a7640000',
        // by default, all accounts are external accounts (not contracts)
        eth_getCode: '0xa',
      };
      const _provider = createTestProviderTools({
        scaffold: _providerResultStub,
      }).provider;
      const _fromAccount = getTestAccounts()[0];
      const _blockTrackerStub = new EventEmitter();
      _blockTrackerStub.getCurrentBlock = noop;
      _blockTrackerStub.getLatestBlock = noop;
      const _txController = new TransactionController({
        provider: _provider,
        getGasPrice() {
          return '0xee6b2800';
        },
        networkStore: new ObservableStore(currentNetworkId),
        getCurrentChainId: () => currentChainId,
        txHistoryLimit: 10,
        blockTracker: _blockTrackerStub,
        signTransaction: (ethTx) =>
          new Promise((resolve) => {
            ethTx.sign(_fromAccount.key);
            resolve();
          }),
        getParticipateInMetrics: () => false,
      });
      const result = await _txController._determineTransactionType({
        to: '0x9e673399f795D01116e9A8B2dD2F156705131ee9',
        data: 'abd',
      });
      assert.deepEqual(result, {
        type: TRANSACTION_TYPES.CONTRACT_INTERACTION,
        getCodeResponse: '0x0a',
      });
    });

    it('should return a contract interaction type with the correct getCodeResponse when to is a contract address and data is falsy', async function () {
      const _providerResultStub = {
        // 1 gwei
        eth_gasPrice: '0x0de0b6b3a7640000',
        // by default, all accounts are external accounts (not contracts)
        eth_getCode: '0xa',
      };
      const _provider = createTestProviderTools({
        scaffold: _providerResultStub,
      }).provider;
      const _fromAccount = getTestAccounts()[0];
      const _blockTrackerStub = new EventEmitter();
      _blockTrackerStub.getCurrentBlock = noop;
      _blockTrackerStub.getLatestBlock = noop;
      const _txController = new TransactionController({
        provider: _provider,
        getGasPrice() {
          return '0xee6b2800';
        },
        networkStore: new ObservableStore(currentNetworkId),
        getCurrentChainId: () => currentChainId,
        txHistoryLimit: 10,
        blockTracker: _blockTrackerStub,
        signTransaction: (ethTx) =>
          new Promise((resolve) => {
            ethTx.sign(_fromAccount.key);
            resolve();
          }),
        getParticipateInMetrics: () => false,
      });
      const result = await _txController._determineTransactionType({
        to: '0x9e673399f795D01116e9A8B2dD2F156705131ee9',
        data: '',
      });
      assert.deepEqual(result, {
        type: TRANSACTION_TYPES.CONTRACT_INTERACTION,
        getCodeResponse: '0x0a',
      });
    });
  });

  describe('#getPendingTransactions', function () {
    it('should show only submitted and approved transactions as pending transaction', function () {
      txController.txStateManager._addTransactionsToState([
        {
          id: 1,
          status: TRANSACTION_STATUSES.UNAPPROVED,
          metamaskNetworkId: currentNetworkId,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
        },
        {
          id: 2,
          status: TRANSACTION_STATUSES.REJECTED,
          metamaskNetworkId: currentNetworkId,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          history: [{}],
        },
        {
          id: 3,
          status: TRANSACTION_STATUSES.APPROVED,
          metamaskNetworkId: currentNetworkId,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          history: [{}],
        },
        {
          id: 4,
          status: TRANSACTION_STATUSES.SIGNED,
          metamaskNetworkId: currentNetworkId,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          history: [{}],
        },
        {
          id: 5,
          status: TRANSACTION_STATUSES.SUBMITTED,
          metamaskNetworkId: currentNetworkId,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          history: [{}],
        },
        {
          id: 6,
          status: TRANSACTION_STATUSES.CONFIRMED,
          metamaskNetworkId: currentNetworkId,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          history: [{}],
        },
        {
          id: 7,
          status: TRANSACTION_STATUSES.FAILED,
          metamaskNetworkId: currentNetworkId,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          history: [{}],
        },
      ]);

      assert.equal(
        txController.pendingTxTracker.getPendingTransactions().length,
        2,
      );
      const states = txController.pendingTxTracker
        .getPendingTransactions()
        .map((tx) => tx.status);
      assert.ok(
        states.includes(TRANSACTION_STATUSES.APPROVED),
        'includes approved',
      );
      assert.ok(
        states.includes(TRANSACTION_STATUSES.SUBMITTED),
        'includes submitted',
      );
    });
  });
});
