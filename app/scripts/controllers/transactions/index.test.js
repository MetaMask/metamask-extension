/* eslint-disable prefer-promise-reject-errors */
import { strict as assert } from 'assert';
import EventEmitter from 'events';
import { toBuffer } from 'ethereumjs-util';
import { TransactionFactory } from '@ethereumjs/tx';
import { ObservableStore } from '@metamask/obs-store';
import { ApprovalType } from '@metamask/controller-utils';
import sinon from 'sinon';

import { errorCodes, ethErrors } from 'eth-rpc-errors';
import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../../shared/constants/security-provider';
import {
  createTestProviderTools,
  getTestAccounts,
} from '../../../../test/stub/provider';
import mockEstimates from '../../../../test/data/mock-estimates.json';
import {
  MetaMetricsEventCategory,
  MetaMetricsTransactionEventSource,
} from '../../../../shared/constants/metametrics';
import {
  TransactionStatus,
  TransactionType,
  TransactionEnvelopeType,
  TransactionMetaMetricsEvent,
  AssetType,
  TokenStandard,
} from '../../../../shared/constants/transaction';

import {
  GasEstimateTypes,
  GasRecommendations,
} from '../../../../shared/constants/gas';
import { ORIGIN_METAMASK } from '../../../../shared/constants/app';
import { NetworkStatus } from '../../../../shared/constants/network';
import { TRANSACTION_ENVELOPE_TYPE_NAMES } from '../../../../shared/lib/transactions-controller-utils';
import TxGasUtil from './tx-gas-utils';
import * as IncomingTransactionHelperClass from './IncomingTransactionHelper';
import TransactionController from '.';

const noop = () => true;
const currentNetworkId = '5';
const currentChainId = '0x5';
const currentNetworkStatus = NetworkStatus.Available;
const providerConfig = {
  type: 'goerli',
};
const actionId = 'DUMMY_ACTION_ID';
const VALID_ADDRESS = '0x0000000000000000000000000000000000000000';
const VALID_ADDRESS_TWO = '0x0000000000000000000000000000000000000001';

const TRANSACTION_META_MOCK = {
  hash: '0x1',
  id: 1,
  status: TransactionStatus.confirmed,
  transaction: {
    from: VALID_ADDRESS,
  },
  time: 123456789,
};

async function flushPromises() {
  await new Promise((resolve) => setImmediate(resolve));
}

describe('Transaction Controller', function () {
  let txController,
    provider,
    providerResultStub,
    fromAccount,
    fragmentExists,
    networkStatusStore,
    preferencesStore,
    getCurrentChainId,
    messengerMock,
    resultCallbacksMock,
    updateSpy,
    incomingTransactionHelperClassMock,
    incomingTransactionHelperEventMock;

  beforeEach(function () {
    fragmentExists = false;
    providerResultStub = {
      // 1 gwei
      eth_gasPrice: '0x0de0b6b3a7640000',
      // by default, all accounts are external accounts (not contracts)
      eth_getCode: '0x',
      eth_sendRawTransaction:
        '0x2a5523c6fa98b47b7d9b6c8320179785150b42a16bcff36b398c5062b65657e8',
    };
    provider = createTestProviderTools({
      scaffold: providerResultStub,
      networkId: currentNetworkId,
      chainId: parseInt(currentChainId, 16),
    }).provider;

    networkStatusStore = new ObservableStore(currentNetworkStatus);
    preferencesStore = new ObservableStore({ advancedGasFee: {} });

    fromAccount = getTestAccounts()[0];
    const blockTrackerStub = new EventEmitter();
    blockTrackerStub.getCurrentBlock = noop;
    blockTrackerStub.getLatestBlock = noop;

    getCurrentChainId = sinon.stub().callsFake(() => currentChainId);

    resultCallbacksMock = {
      success: sinon.spy(),
      error: sinon.spy(),
    };

    messengerMock = {
      call: sinon.stub(),
    };

    incomingTransactionHelperEventMock = sinon.spy();

    incomingTransactionHelperClassMock = sinon
      .stub(IncomingTransactionHelperClass, 'IncomingTransactionHelper')
      .returns({
        hub: {
          on: incomingTransactionHelperEventMock,
        },
      });

    txController = new TransactionController({
      provider,
      getGasPrice() {
        return '0xee6b2800';
      },
      getNetworkId: () => currentNetworkId,
      getNetworkStatus: () => networkStatusStore.getState(),
      onNetworkStateChange: (listener) =>
        networkStatusStore.subscribe(listener),
      getCurrentNetworkEIP1559Compatibility: () => Promise.resolve(false),
      getCurrentAccountEIP1559Compatibility: () => false,
      txHistoryLimit: 10,
      blockTracker: blockTrackerStub,
      signTransaction: (ethTx) =>
        new Promise((resolve) => {
          resolve(ethTx.sign(fromAccount.key));
        }),
      getProviderConfig: () => providerConfig,
      getPermittedAccounts: () => undefined,
      getCurrentChainId,
      getParticipateInMetrics: () => false,
      trackMetaMetricsEvent: () => undefined,
      createEventFragment: () => undefined,
      updateEventFragment: () => undefined,
      finalizeEventFragment: () => undefined,
      getEventFragmentById: () =>
        fragmentExists === false ? undefined : { id: 0 },
      getEIP1559GasFeeEstimates: () => undefined,
      getAccountType: () => 'MetaMask',
      getDeviceModel: () => 'N/A',
      securityProviderRequest: () => undefined,
      preferencesStore,
      messenger: messengerMock,
    });

    txController.nonceTracker.getNonceLock = () =>
      Promise.resolve({ nextNonce: 0, releaseLock: noop });

    updateSpy = sinon.spy(txController.txStateManager, 'updateTransaction');

    messengerMock.call.callsFake((_) =>
      Promise.resolve({
        value: { txMeta: getLastTxMeta() },
        resultCallbacks: resultCallbacksMock,
      }),
    );
  });

  afterEach(function () {
    incomingTransactionHelperClassMock.restore();
  });

  function getLastTxMeta() {
    return updateSpy.lastCall.args[0];
  }

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
          status: TransactionStatus.unapproved,
          metamaskNetworkId: currentNetworkId,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          history: [{}],
        },
        {
          id: 2,
          status: TransactionStatus.unapproved,
          metamaskNetworkId: currentNetworkId,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          history: [{}],
        },
        {
          id: 3,
          status: TransactionStatus.unapproved,
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
          status: TransactionStatus.submitted,
          metamaskNetworkId: currentNetworkId,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          history: [{}],
        },
        {
          id: 2,
          status: TransactionStatus.submitted,
          metamaskNetworkId: currentNetworkId,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          history: [{}],
        },
        {
          id: 3,
          status: TransactionStatus.submitted,
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
          status: TransactionStatus.confirmed,
          metamaskNetworkId: currentNetworkId,
          txParams,
          history: [{}],
        },
        {
          id: 1,
          status: TransactionStatus.confirmed,
          metamaskNetworkId: currentNetworkId,
          txParams,
          history: [{}],
        },
        {
          id: 2,
          status: TransactionStatus.confirmed,
          metamaskNetworkId: currentNetworkId,
          txParams,
          history: [{}],
        },
        {
          id: 3,
          status: TransactionStatus.unapproved,
          metamaskNetworkId: currentNetworkId,
          txParams,
          history: [{}],
        },
        {
          id: 4,
          status: TransactionStatus.rejected,
          metamaskNetworkId: currentNetworkId,
          txParams,
          history: [{}],
        },
        {
          id: 5,
          status: TransactionStatus.approved,
          metamaskNetworkId: currentNetworkId,
          txParams,
          history: [{}],
        },
        {
          id: 6,
          status: TransactionStatus.signed,
          metamaskNetworkId: currentNetworkId,
          txParams,
          history: [{}],
        },
        {
          id: 7,
          status: TransactionStatus.submitted,
          metamaskNetworkId: currentNetworkId,
          txParams,
          history: [{}],
        },
        {
          id: 8,
          status: TransactionStatus.failed,
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

  describe('#addTransaction', function () {
    const selectedAddress = '0xc684832530fcbddae4b4230a47e991ddcec2831d';
    const recipientAddress = '0xc684832530fcbddae4b4230a47e991ddcec2831d';

    let txMeta,
      txParams,
      getPermittedAccounts,
      signStub,
      getSelectedAddress,
      getDefaultGasFees;

    beforeEach(function () {
      txParams = {
        from: selectedAddress,
        to: recipientAddress,
      };

      txMeta = {
        status: TransactionStatus.unapproved,
        id: 1,
        metamaskNetworkId: currentNetworkId,
        txParams,
        history: [{}],
      };

      txController.txStateManager._addTransactionsToState([txMeta]);

      getPermittedAccounts = sinon
        .stub(txController, 'getPermittedAccounts')
        .returns([txParams.from]);

      getSelectedAddress = sinon
        .stub(txController, 'getSelectedAddress')
        .returns(selectedAddress);

      getDefaultGasFees = sinon
        .stub(txController, '_getDefaultGasFees')
        .returns({});
    });

    afterEach(function () {
      txController.txStateManager._addTransactionsToState([]);
      getPermittedAccounts.restore();
      signStub?.restore();
      getSelectedAddress.restore();
      getDefaultGasFees.restore();
    });

    it('adds an unapproved transaction and returns transaction metadata', async function () {
      ({ transactionMeta: txMeta } = await txController.addTransaction({
        from: selectedAddress,
        to: recipientAddress,
      }));
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

    it('creates an approval request', async function () {
      await txController.addTransaction(txParams);

      const txId = getLastTxMeta().id;

      assert.equal(messengerMock.call.callCount, 1);
      assert.deepEqual(messengerMock.call.getCall(0).args, [
        'ApprovalController:addRequest',
        {
          id: String(txId),
          origin: undefined,
          requestData: { txId },
          type: ApprovalType.Transaction,
          expectsResult: true,
        },
        true, // Show popup
      ]);
    });

    it('throws if the from address is not the selected address', async function () {
      await assert.rejects(() =>
        txController.addTransaction({
          from: '0x0d1d4e623D10F9FBA5Db95830F7d3839406C6AF2',
        }),
      );
    });

    it('throws if the network status is not available', async function () {
      networkStatusStore.putState(NetworkStatus.Unknown);
      await assert.rejects(
        () =>
          txController.addTransaction({
            from: selectedAddress,
            to: '0x0d1d4e623D10F9FBA5Db95830F7d3839406C6AF2',
          }),
        { message: 'MetaMask is having trouble connecting to the network' },
      );
    });

    it('updates meta if type is swap approval', async function () {
      await txController.addTransaction(
        {
          from: selectedAddress,
          to: recipientAddress,
        },
        {
          origin: ORIGIN_METAMASK,
          type: TransactionType.swapApproval,
          actionId: '12345',
          swaps: { meta: { type: 'swapApproval', sourceTokenSymbol: 'XBN' } },
        },
      );

      const transaction = txController.getTransactions({
        searchCriteria: { id: getLastTxMeta().id },
      })[0];

      assert.equal(transaction.type, 'swapApproval');
      assert.equal(transaction.sourceTokenSymbol, 'XBN');
    });

    it('updates meta if type is swap', async function () {
      await txController.addTransaction(
        {
          from: selectedAddress,
          to: recipientAddress,
        },
        {
          origin: ORIGIN_METAMASK,
          type: TransactionType.swap,
          actionId: '12345',
          swaps: {
            meta: {
              sourceTokenSymbol: 'BTCX',
              destinationTokenSymbol: 'ETH',
              type: 'swapped',
              destinationTokenDecimals: 8,
              destinationTokenAddress: VALID_ADDRESS_TWO,
              swapTokenValue: '0x0077',
            },
          },
        },
      );

      const transaction = txController.getTransactions({
        searchCriteria: { id: getLastTxMeta().id },
      })[0];

      assert.equal(transaction.sourceTokenSymbol, 'BTCX');
      assert.equal(transaction.destinationTokenSymbol, 'ETH');
      assert.equal(transaction.type, 'swapped');
      assert.equal(transaction.destinationTokenDecimals, 8);
      assert.equal(transaction.destinationTokenAddress, VALID_ADDRESS_TWO);
      assert.equal(transaction.swapTokenValue, '0x0077');
    });

    describe('if swaps trade with no approval transaction and simulation fails', function () {
      let analyzeGasUsageOriginal;

      beforeEach(function () {
        analyzeGasUsageOriginal = TxGasUtil.prototype.analyzeGasUsage;

        sinon.stub(TxGasUtil.prototype, 'analyzeGasUsage').returns({
          simulationFails: true,
        });
      });

      afterEach(function () {
        // Sinon restore didn't work
        TxGasUtil.prototype.analyzeGasUsage = analyzeGasUsageOriginal;
      });

      it('throws error', async function () {
        await assert.rejects(
          txController.addTransaction(
            {
              from: selectedAddress,
              to: recipientAddress,
            },
            {
              origin: ORIGIN_METAMASK,
              type: TransactionType.swap,
              actionId: '12345',
              swaps: {
                hasApproveTx: false,
              },
            },
          ),
          new Error('Simulation failed'),
        );
      });

      it('cancels transaction', async function () {
        const listener = sinon.spy();

        txController.on('tx:status-update', listener);

        try {
          await txController.addTransaction(
            {
              from: selectedAddress,
              to: recipientAddress,
            },
            {
              origin: ORIGIN_METAMASK,
              type: TransactionType.swap,
              actionId: '12345',
              swaps: {
                hasApproveTx: false,
              },
            },
          );
        } catch (error) {
          // Expected error
        }

        assert.equal(listener.callCount, 1, listener.args);

        const [txId, status] = listener.args[0];

        assert.equal(status, TransactionStatus.rejected);
        assert.equal(txId, getLastTxMeta().id);
      });
    });

    describe('with actionId', function () {
      it('adds single unapproved transaction when called twice with same actionId', async function () {
        await txController.addTransaction(
          {
            from: selectedAddress,
            to: recipientAddress,
          },
          { actionId: '12345' },
        );
        const transactionCount1 =
          txController.txStateManager.getTransactions().length;
        await txController.addTransaction(
          {
            from: selectedAddress,
            to: recipientAddress,
          },
          { actionId: '12345' },
        );
        const transactionCount2 =
          txController.txStateManager.getTransactions().length;
        assert.equal(transactionCount1, transactionCount2);
      });

      it('adds single approval request when called twice with same actionId', async function () {
        await txController.addTransaction(txParams, { actionId: '12345' });
        await txController.addTransaction(txParams, { actionId: '12345' });

        const txId = getLastTxMeta().id;

        assert.equal(messengerMock.call.callCount, 1);
        assert.deepEqual(messengerMock.call.getCall(0).args, [
          'ApprovalController:addRequest',
          {
            id: String(txId),
            origin: undefined,
            requestData: { txId },
            type: ApprovalType.Transaction,
            expectsResult: true,
          },
          true, // Show popup
        ]);
      });

      it('adds multiple transactions when called with different actionId', async function () {
        await txController.addTransaction(
          {
            from: selectedAddress,
            to: recipientAddress,
          },
          { actionId: '12345' },
        );
        const transactionCount1 =
          txController.txStateManager.getTransactions().length;
        await txController.addTransaction(
          {
            from: selectedAddress,
            to: recipientAddress,
          },
          { actionId: '00000' },
        );
        const transactionCount2 =
          txController.txStateManager.getTransactions().length;
        assert.equal(transactionCount1 + 1, transactionCount2);
      });

      it('resolves second result when first transaction is finished', async function () {
        let firstTransactionResolve;
        let firstTransactionCompleted = false;
        let secondTransactionCompleted = false;

        messengerMock.call.returns(
          new Promise((resolve) => {
            firstTransactionResolve = resolve;
          }),
        );

        const { result: firstResult } = await txController.addTransaction(
          txParams,
          { actionId: '12345' },
        );

        firstResult.then(() => {
          firstTransactionCompleted = true;
        });

        const { result: secondResult } = await txController.addTransaction(
          txParams,
          { actionId: '12345' },
        );

        secondResult.then(() => {
          secondTransactionCompleted = true;
        });

        await flushPromises();

        assert.equal(firstTransactionCompleted, false);
        assert.equal(secondTransactionCompleted, false);

        firstTransactionResolve({ value: { txMeta: getLastTxMeta() } });

        await flushPromises();
        await firstResult;
        await secondResult;

        assert.equal(firstTransactionCompleted, true);
        assert.equal(secondTransactionCompleted, true);
      });
    });

    describe('on success', function () {
      it('resolves result with the transaction hash', async function () {
        const { result } = await txController.addTransaction(txParams);
        const hash = await result;
        assert.ok(hash, 'addTransaction needs to return the hash');
      });

      it('changes status to submitted', async function () {
        const { result } = await txController.addTransaction(
          {
            from: selectedAddress,
            to: recipientAddress,
          },
          { origin: ORIGIN_METAMASK, actionId: '12345' },
        );

        await result;

        const transaction = txController.getTransactions({
          searchCriteria: { id: getLastTxMeta().id },
        })[0];

        assert.equal(transaction.status, TransactionStatus.submitted);
      });

      it('emits approved, signed, and submitted status events', async function () {
        const listener = sinon.spy();

        txController.on('tx:status-update', listener);

        const { result } = await txController.addTransaction(
          {
            from: selectedAddress,
            to: recipientAddress,
          },
          { origin: ORIGIN_METAMASK, actionId: '12345' },
        );

        await result;

        const txId = getLastTxMeta().id;

        assert.equal(listener.callCount, 3);
        assert.equal(listener.args[0][0], txId);
        assert.equal(listener.args[0][1], TransactionStatus.approved);
        assert.equal(listener.args[1][0], txId);
        assert.equal(listener.args[1][1], TransactionStatus.signed);
        assert.equal(listener.args[2][0], txId);
        assert.equal(listener.args[2][1], TransactionStatus.submitted);
      });

      it('reports success to approval request acceptor', async function () {
        const { result } = await txController.addTransaction(
          {
            from: selectedAddress,
            to: recipientAddress,
          },
          { origin: ORIGIN_METAMASK, actionId: '12345' },
        );

        await result;

        assert.equal(resultCallbacksMock.success.callCount, 1);
      });

      it('does not overwrite set values', async function () {
        const originalValue = '0x01';
        const wrongValue = '0x05';

        providerResultStub.eth_gasPrice = wrongValue;
        providerResultStub.eth_estimateGas = '0x5209';

        signStub = sinon
          .stub(txController, '_signTransaction')
          .callsFake(() => Promise.resolve());

        const pubStub = sinon
          .stub(txController, '_publishTransaction')
          .callsFake(() => {
            const txId = getLastTxMeta().id;
            txController.setTxHash(txId, originalValue);
            txController.txStateManager.setTxStatusSubmitted(txId);
          });

        const { result } = await txController.addTransaction(
          {
            from: selectedAddress,
            to: recipientAddress,
            nonce: originalValue,
            gas: originalValue,
            gasPrice: originalValue,
          },
          { origin: ORIGIN_METAMASK, actionId: '12345' },
        );

        await result;

        const txId = getLastTxMeta().id;
        const finalMeta = txController.txStateManager.getTransaction(txId);
        const params = finalMeta.txParams;

        assert.equal(params.gas, originalValue, 'gas unmodified');
        assert.equal(params.gasPrice, originalValue, 'gas price unmodified');
        assert.equal(finalMeta.hash, originalValue);
        assert.equal(
          finalMeta.status,
          TransactionStatus.submitted,
          'should have reached the submitted status.',
        );

        signStub.restore();
        pubStub.restore();
      });
    });

    describe('on cancel', function () {
      beforeEach(async function () {
        messengerMock.call.returns(
          Promise.reject({ code: errorCodes.provider.userRejectedRequest }),
        );
      });

      it('rejects result', async function () {
        const { result } = await txController.addTransaction(
          {
            from: selectedAddress,
            to: recipientAddress,
          },
          { origin: ORIGIN_METAMASK, actionId: '12345' },
        );

        await assert.rejects(result, {
          code: ethErrors.provider.userRejectedRequest().code,
          message: 'MetaMask Tx Signature: User denied transaction signature.',
        });
      });

      it('emits rejected status event', async function () {
        const listener = sinon.spy();

        txController.on('tx:status-update', listener);

        const { result } = await txController.addTransaction(
          {
            from: selectedAddress,
            to: recipientAddress,
          },
          { origin: ORIGIN_METAMASK, actionid: '12345' },
        );

        try {
          await result;
        } catch (error) {
          // Expected error
        }

        assert.equal(listener.callCount, 1);

        const [txId, status] = listener.args[0];

        assert.equal(status, TransactionStatus.rejected);
        assert.equal(txId, getLastTxMeta().id);
      });
    });

    describe('on signing error', function () {
      const signError = new Error('TestSignError');

      beforeEach(async function () {
        signStub = sinon.stub(txController, 'signEthTx').throws(signError);
      });

      afterEach(function () {
        signStub.restore();
      });

      it('changes status to failed', async function () {
        const { result } = await txController.addTransaction(
          {
            from: selectedAddress,
            to: recipientAddress,
          },
          { origin: ORIGIN_METAMASK, actionId: '12345' },
        );

        try {
          await result;
        } catch {
          // Expected error
        }

        const transaction = txController.getTransactions({
          searchCriteria: { id: getLastTxMeta().id },
        })[0];

        assert.equal(transaction.status, TransactionStatus.failed);
      });

      it('rejects result', async function () {
        const { result } = await txController.addTransaction(
          {
            from: selectedAddress,
            to: recipientAddress,
          },
          { origin: ORIGIN_METAMASK, actionId: '12345' },
        );

        await assert.rejects(result, signError);
      });

      it('emits approved and failed status events', async function () {
        const listener = sinon.spy();

        txController.on('tx:status-update', listener);

        const { result } = await txController.addTransaction(
          {
            from: selectedAddress,
            to: recipientAddress,
          },
          { origin: ORIGIN_METAMASK, actionId: '12345' },
        );

        try {
          await result;
        } catch (error) {
          // Expected error
        }

        const txId = getLastTxMeta().id;

        assert.equal(listener.callCount, 2);
        assert.equal(listener.args[0][0], txId);
        assert.equal(listener.args[0][1], TransactionStatus.approved);
        assert.equal(listener.args[1][0], txId);
        assert.equal(listener.args[1][1], TransactionStatus.failed);
      });

      it('reports error to approval request acceptor', async function () {
        const { result } = await txController.addTransaction(
          {
            from: selectedAddress,
            to: recipientAddress,
          },
          { origin: ORIGIN_METAMASK, actionId: '12345' },
        );

        try {
          await result;
        } catch {
          // Expected error
        }

        assert.equal(resultCallbacksMock.error.callCount, 1);
        assert.strictEqual(
          resultCallbacksMock.error.getCall(0).args[0].message,
          signError.message,
        );
      });
    });

    describe('on publish error', function () {
      const publishError = new Error('TestPublishError');
      let originalQuery;

      beforeEach(async function () {
        originalQuery = txController.query;

        txController.query = {
          sendRawTransaction: sinon.stub().throws(publishError),
        };
      });

      afterEach(function () {
        txController.query = originalQuery;
      });

      it('changes status to failed', async function () {
        const { result } = await txController.addTransaction(
          {
            from: selectedAddress,
            to: recipientAddress,
          },
          { origin: ORIGIN_METAMASK, actionId: '12345' },
        );

        try {
          await result;
        } catch {
          // Expected error
        }

        const transaction = txController.getTransactions({
          searchCriteria: { id: getLastTxMeta().id },
        })[0];

        assert.equal(transaction.status, TransactionStatus.failed);
      });

      it('rejects result', async function () {
        const { result } = await txController.addTransaction(
          {
            from: selectedAddress,
            to: recipientAddress,
          },
          { origin: ORIGIN_METAMASK, actionId: '12345' },
        );

        await assert.rejects(result, publishError);
      });

      it('emits approved, signed, and failed status events', async function () {
        const listener = sinon.spy();

        txController.on('tx:status-update', listener);

        const { result } = await txController.addTransaction(
          {
            from: selectedAddress,
            to: recipientAddress,
          },
          { origin: ORIGIN_METAMASK, actionId: '12345' },
        );

        try {
          await result;
        } catch (error) {
          // Expected error
        }

        const txId = getLastTxMeta().id;

        assert.equal(listener.callCount, 3);
        assert.equal(listener.args[0][0], txId);
        assert.equal(listener.args[0][1], TransactionStatus.approved);
        assert.equal(listener.args[1][0], txId);
        assert.equal(listener.args[1][1], TransactionStatus.signed);
        assert.equal(listener.args[2][0], txId);
        assert.equal(listener.args[2][1], TransactionStatus.failed);
      });

      it('reports error to approval request acceptor', async function () {
        const { result } = await txController.addTransaction(
          {
            from: selectedAddress,
            to: recipientAddress,
          },
          { origin: ORIGIN_METAMASK, actionId: '12345' },
        );

        try {
          await result;
        } catch {
          // Expected error
        }

        assert.equal(resultCallbacksMock.error.callCount, 1);
        assert.strictEqual(
          resultCallbacksMock.error.getCall(0).args[0].message,
          publishError.message,
        );
      });
    });

    describe('with require approval set to false', function () {
      beforeEach(function () {
        // Ensure that the default approval mock is not being used
        messengerMock.call.callsFake(() => Promise.reject());
      });

      it('resolves result with the transaction hash', async function () {
        const { result } = await txController.addTransaction(txParams, {
          requireApproval: false,
        });
        const hash = await result;
        assert.ok(hash, 'addTransaction needs to return the hash');
      });

      it('changes status to submitted', async function () {
        const { result } = await txController.addTransaction(
          {
            from: selectedAddress,
            to: recipientAddress,
          },
          {
            origin: ORIGIN_METAMASK,
            actionid: '12345',
            requireApproval: false,
          },
        );

        await result;

        const transaction = txController.getTransactions({
          searchCriteria: { id: getLastTxMeta().id },
        })[0];

        assert.equal(transaction.status, TransactionStatus.submitted);
      });

      it('emits approved, signed, and submitted status events', async function () {
        const listener = sinon.spy();

        txController.on('tx:status-update', listener);

        const { result } = await txController.addTransaction(
          {
            from: selectedAddress,
            to: recipientAddress,
          },
          {
            origin: ORIGIN_METAMASK,
            actionId: '12345',
            requireApproval: false,
          },
        );

        await result;

        const txId = getLastTxMeta().id;

        assert.equal(listener.callCount, 3);
        assert.equal(listener.args[0][0], txId);
        assert.equal(listener.args[0][1], TransactionStatus.approved);
        assert.equal(listener.args[1][0], txId);
        assert.equal(listener.args[1][1], TransactionStatus.signed);
        assert.equal(listener.args[2][0], txId);
        assert.equal(listener.args[2][1], TransactionStatus.submitted);
      });
    });
  });

  describe('#createCancelTransaction', function () {
    const selectedAddress = '0x1678a085c290ebd122dc42cba69373b5953b831d';
    const recipientAddress = '0xc42edfcc21ed14dda456aa0756c153f7985d8813';

    let getSelectedAddress,
      getPermittedAccounts,
      getDefaultGasFees,
      getDefaultGasLimit;
    beforeEach(function () {
      const hash =
        '0x2a5523c6fa98b47b7d9b6c8320179785150b42a16bcff36b398c5062b65657e8';
      providerResultStub.eth_sendRawTransaction = hash;

      getSelectedAddress = sinon
        .stub(txController, 'getSelectedAddress')
        .returns(selectedAddress);
      getDefaultGasFees = sinon
        .stub(txController, '_getDefaultGasFees')
        .returns({});
      getDefaultGasLimit = sinon
        .stub(txController, '_getDefaultGasLimit')
        .returns({});
      getPermittedAccounts = sinon
        .stub(txController, 'getPermittedAccounts')
        .returns([selectedAddress]);
    });

    afterEach(function () {
      getSelectedAddress.restore();
      getPermittedAccounts.restore();
      getDefaultGasFees.restore();
      getDefaultGasLimit.restore();
    });

    it('should add a cancel transaction and return a valid txMeta', async function () {
      const { transactionMeta: txMeta, result } =
        await txController.addTransaction({
          from: selectedAddress,
          to: recipientAddress,
        });
      await result;
      const cancelTxMeta = await txController.createCancelTransaction(
        txMeta.id,
        {},
        { actionId: 12345 },
      );
      assert.equal(cancelTxMeta.type, TransactionType.cancel);
      const memTxMeta = txController.txStateManager.getTransaction(
        cancelTxMeta.id,
      );
      assert.deepEqual(cancelTxMeta, memTxMeta);
      assert.equal(messengerMock.call.callCount, 1);
    });

    it('should add only 1 cancel transaction when called twice with same actionId', async function () {
      const { transactionMeta: txMeta, result } =
        await txController.addTransaction({
          from: selectedAddress,
          to: recipientAddress,
        });
      await result;
      await txController.createCancelTransaction(
        txMeta.id,
        {},
        { actionId: 12345 },
      );
      const transactionCount1 =
        txController.txStateManager.getTransactions().length;
      await txController.createCancelTransaction(
        txMeta.id,
        {},
        { actionId: 12345 },
      );
      const transactionCount2 =
        txController.txStateManager.getTransactions().length;
      assert.equal(transactionCount1, transactionCount2);
    });

    it('should add multiple transactions when called with different actionId', async function () {
      const { transactionMeta: txMeta, result } =
        await txController.addTransaction({
          from: selectedAddress,
          to: recipientAddress,
        });
      await result;
      await txController.createCancelTransaction(
        txMeta.id,
        {},
        { actionId: 12345 },
      );
      const transactionCount1 =
        txController.txStateManager.getTransactions().length;
      await txController.createCancelTransaction(
        txMeta.id,
        {},
        { actionId: 11111 },
      );
      const transactionCount2 =
        txController.txStateManager.getTransactions().length;
      assert.equal(transactionCount1 + 1, transactionCount2);
    });
  });

  describe('_addTxGasDefaults', function () {
    it('should add the tx defaults if their are none', async function () {
      txController.txStateManager._addTransactionsToState([
        {
          id: 1,
          status: TransactionStatus.unapproved,
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

      const txMetaWithDefaults = await txController._addTxGasDefaults(txMeta);
      assert.ok(
        txMetaWithDefaults.txParams.gasPrice,
        'should have added the gas price',
      );
      assert.ok(
        txMetaWithDefaults.txParams.gas,
        'should have added the gas field',
      );
    });

    it('should add EIP1559 tx defaults', async function () {
      const TEST_MAX_FEE_PER_GAS = '0x12a05f200';
      const TEST_MAX_PRIORITY_FEE_PER_GAS = '0x77359400';

      const stub1 = sinon
        .stub(txController, '_getEIP1559Compatibility')
        .returns(true);

      const stub2 = sinon
        .stub(txController, '_getDefaultGasFees')
        .callsFake(() => ({
          maxFeePerGas: TEST_MAX_FEE_PER_GAS,
          maxPriorityFeePerGas: TEST_MAX_PRIORITY_FEE_PER_GAS,
        }));

      txController.txStateManager._addTransactionsToState([
        {
          id: 1,
          status: TransactionStatus.unapproved,
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
      providerResultStub.eth_getBlockByNumber = { gasLimit: '47b784' };
      providerResultStub.eth_estimateGas = '5209';

      const txMetaWithDefaults = await txController._addTxGasDefaults(txMeta);

      assert.equal(
        txMetaWithDefaults.txParams.maxFeePerGas,
        TEST_MAX_FEE_PER_GAS,
        'should have added the correct max fee per gas',
      );
      assert.equal(
        txMetaWithDefaults.txParams.maxPriorityFeePerGas,
        TEST_MAX_PRIORITY_FEE_PER_GAS,
        'should have added the correct max priority fee per gas',
      );
      stub1.restore();
      stub2.restore();
    });

    it('should add gasPrice as maxFeePerGas and maxPriorityFeePerGas if there are no sources of other fee data available', async function () {
      const TEST_GASPRICE = '0x12a05f200';

      const stub1 = sinon
        .stub(txController, '_getEIP1559Compatibility')
        .returns(true);

      const stub2 = sinon
        .stub(txController, '_getDefaultGasFees')
        .callsFake(() => ({ gasPrice: TEST_GASPRICE }));

      txController.txStateManager._addTransactionsToState([
        {
          id: 1,
          status: TransactionStatus.unapproved,
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
      providerResultStub.eth_getBlockByNumber = { gasLimit: '47b784' };
      providerResultStub.eth_estimateGas = '5209';

      const txMetaWithDefaults = await txController._addTxGasDefaults(txMeta);

      assert.equal(
        txMetaWithDefaults.txParams.maxFeePerGas,
        TEST_GASPRICE,
        'should have added the correct max fee per gas',
      );
      assert.equal(
        txMetaWithDefaults.txParams.maxPriorityFeePerGas,
        TEST_GASPRICE,
        'should have added the correct max priority fee per gas',
      );
      stub1.restore();
      stub2.restore();
    });

    it('should not add maxFeePerGas and maxPriorityFeePerGas to type-0 transactions', async function () {
      const TEST_GASPRICE = '0x12a05f200';

      const stub1 = sinon
        .stub(txController, '_getEIP1559Compatibility')
        .returns(true);

      const stub2 = sinon
        .stub(txController, '_getDefaultGasFees')
        .callsFake(() => ({ gasPrice: TEST_GASPRICE }));

      txController.txStateManager._addTransactionsToState([
        {
          id: 1,
          status: TransactionStatus.unapproved,
          metamaskNetworkId: currentNetworkId,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
            type: TransactionEnvelopeType.legacy,
          },
          history: [{}],
        },
      ]);
      const txMeta = {
        id: 1,
        txParams: {
          from: '0xc684832530fcbddae4b4230a47e991ddcec2831d',
          to: '0xc684832530fcbddae4b4230a47e991ddcec2831d',
          type: TransactionEnvelopeType.legacy,
        },
        history: [{}],
      };
      providerResultStub.eth_getBlockByNumber = { gasLimit: '47b784' };
      providerResultStub.eth_estimateGas = '5209';

      const txMetaWithDefaults = await txController._addTxGasDefaults(txMeta);

      assert.equal(
        txMetaWithDefaults.txParams.maxFeePerGas,
        undefined,
        'should not have maxFeePerGas',
      );
      assert.equal(
        txMetaWithDefaults.txParams.maxPriorityFeePerGas,
        undefined,
        'should not have max priority fee per gas',
      );
      stub1.restore();
      stub2.restore();
    });

    it('should not add gasPrice if the fee data is available from the dapp', async function () {
      const TEST_GASPRICE = '0x12a05f200';
      const TEST_MAX_FEE_PER_GAS = '0x12a05f200';
      const TEST_MAX_PRIORITY_FEE_PER_GAS = '0x77359400';

      const stub1 = sinon
        .stub(txController, '_getEIP1559Compatibility')
        .returns(true);

      const stub2 = sinon
        .stub(txController, '_getDefaultGasFees')
        .callsFake(() => ({ gasPrice: TEST_GASPRICE }));

      txController.txStateManager._addTransactionsToState([
        {
          id: 1,
          status: TransactionStatus.unapproved,
          metamaskNetworkId: currentNetworkId,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
            maxFeePerGas: TEST_MAX_FEE_PER_GAS,
            maxPriorityFeePerGas: TEST_MAX_PRIORITY_FEE_PER_GAS,
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
      providerResultStub.eth_getBlockByNumber = { gasLimit: '47b784' };
      providerResultStub.eth_estimateGas = '5209';

      const txMetaWithDefaults = await txController._addTxGasDefaults(txMeta);

      assert.equal(
        txMetaWithDefaults.txParams.maxFeePerGas,
        TEST_MAX_FEE_PER_GAS,
        'should have added the correct max fee per gas',
      );
      assert.equal(
        txMetaWithDefaults.txParams.maxPriorityFeePerGas,
        TEST_MAX_PRIORITY_FEE_PER_GAS,
        'should have added the correct max priority fee per gas',
      );
      stub1.restore();
      stub2.restore();
    });
  });

  describe('_getDefaultGasFees', function () {
    let getGasFeeStub;

    beforeEach(function () {
      getGasFeeStub = sinon.stub(txController, '_getEIP1559GasFeeEstimates');
    });

    afterEach(function () {
      getGasFeeStub.restore();
    });

    it('should return the correct fee data when the gas estimate type is FEE_MARKET', async function () {
      const EXPECTED_MAX_FEE_PER_GAS = '12a05f200';
      const EXPECTED_MAX_PRIORITY_FEE_PER_GAS = '77359400';

      getGasFeeStub.callsFake(() => ({
        gasFeeEstimates: {
          medium: {
            suggestedMaxPriorityFeePerGas: '2',
            suggestedMaxFeePerGas: '5',
          },
        },
        gasEstimateType: GasEstimateTypes.feeMarket,
      }));

      const defaultGasFees = await txController._getDefaultGasFees(
        { txParams: {} },
        true,
      );

      assert.deepEqual(defaultGasFees, {
        maxPriorityFeePerGas: EXPECTED_MAX_PRIORITY_FEE_PER_GAS,
        maxFeePerGas: EXPECTED_MAX_FEE_PER_GAS,
      });
    });

    it('should return the correct fee data when the gas estimate type is LEGACY', async function () {
      const EXPECTED_GAS_PRICE = '77359400';

      getGasFeeStub.callsFake(() => ({
        gasFeeEstimates: { medium: '2' },
        gasEstimateType: GasEstimateTypes.legacy,
      }));

      const defaultGasFees = await txController._getDefaultGasFees(
        { txParams: {} },
        false,
      );

      assert.deepEqual(defaultGasFees, {
        gasPrice: EXPECTED_GAS_PRICE,
      });
    });

    it('should return the correct fee data when the gas estimate type is ETH_GASPRICE', async function () {
      const EXPECTED_GAS_PRICE = '77359400';

      getGasFeeStub.callsFake(() => ({
        gasFeeEstimates: { gasPrice: '2' },
        gasEstimateType: GasEstimateTypes.ethGasPrice,
      }));

      const defaultGasFees = await txController._getDefaultGasFees(
        { txParams: {} },
        false,
      );

      assert.deepEqual(defaultGasFees, {
        gasPrice: EXPECTED_GAS_PRICE,
      });
    });
  });

  describe('#sign replay-protected tx', function () {
    it('prepares a tx with the chainId set', async function () {
      txController._addTransaction(
        {
          id: '1',
          status: TransactionStatus.unapproved,
          metamaskNetworkId: currentNetworkId,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
        },
        noop,
      );
      const rawTx = await txController._signTransaction('1');
      const ethTx = TransactionFactory.fromSerializedData(toBuffer(rawTx));
      assert.equal(Number(ethTx.common.chainId()), 5);
    });
  });

  describe('_getChainId', function () {
    it('returns the chain ID of the network when it is available', function () {
      networkStatusStore.putState(NetworkStatus.Available);
      assert.equal(txController._getChainId(), 5);
    });

    it('returns 0 when the network is not available', function () {
      networkStatusStore.putState('NOT_INTEGER');
      assert.equal(txController._getChainId(), 0);
    });

    it('returns 0 when the chain ID cannot be parsed as a hex string', function () {
      networkStatusStore.putState(NetworkStatus.Available);
      getCurrentChainId.returns('NOT_INTEGER');
      assert.equal(txController._getChainId(), 0);
    });
  });

  describe('#createSpeedUpTransaction', function () {
    let addTransactionSpy;
    let approveTransactionSpy;
    let txParams;
    let expectedTxParams;
    const selectedAddress = '0x1678a085c290ebd122dc42cba69373b5953b831d';
    const recipientAddress = '0xc42edfcc21ed14dda456aa0756c153f7985d8813';

    let getSelectedAddress,
      getPermittedAccounts,
      getDefaultGasFees,
      getDefaultGasLimit;

    beforeEach(function () {
      addTransactionSpy = sinon.spy(txController, '_addTransaction');
      approveTransactionSpy = sinon.spy(txController, '_approveTransaction');

      const hash =
        '0x2a5523c6fa98b47b7d9b6c8320179785150b42a16bcff36b398c5062b65657e8';
      providerResultStub.eth_sendRawTransaction = hash;

      getSelectedAddress = sinon
        .stub(txController, 'getSelectedAddress')
        .returns(selectedAddress);
      getDefaultGasFees = sinon
        .stub(txController, '_getDefaultGasFees')
        .returns({});
      getDefaultGasLimit = sinon
        .stub(txController, '_getDefaultGasLimit')
        .returns({});
      getPermittedAccounts = sinon
        .stub(txController, 'getPermittedAccounts')
        .returns([selectedAddress]);

      txParams = {
        nonce: '0x00',
        from: '0xB09d8505E1F4EF1CeA089D47094f5DD3464083d4',
        to: '0xB09d8505E1F4EF1CeA089D47094f5DD3464083d4',
        gas: '0x5209',
        gasPrice: '0xa',
        estimateSuggested: GasRecommendations.medium,
        estimateUsed: GasRecommendations.high,
      };
      txController.txStateManager._addTransactionsToState([
        {
          id: 1,
          status: TransactionStatus.submitted,
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
      getSelectedAddress.restore();
      getPermittedAccounts.restore();
      getDefaultGasFees.restore();
      getDefaultGasLimit.restore();
    });

    it('should call this.addTransaction and this.approveTransaction with the expected args', async function () {
      await txController.createSpeedUpTransaction(1);
      assert.equal(addTransactionSpy.callCount, 1);

      const addTransactionArgs = addTransactionSpy.getCall(0).args[0];
      assert.deepEqual(addTransactionArgs.txParams, expectedTxParams);

      const { previousGasParams, type } = addTransactionArgs;
      assert.deepEqual(
        { gasPrice: previousGasParams.gasPrice, type },
        {
          gasPrice: '0xa',
          type: TransactionType.retry,
        },
      );
      assert.equal(messengerMock.call.callCount, 0);
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

      const { previousGasParams, type } = result;
      assert.deepEqual(
        { gasPrice: previousGasParams.gasPrice, type },
        {
          gasPrice: '0xa',
          type: TransactionType.retry,
        },
      );
    });

    it('should add only 1 speedup transaction when called twice with same actionId', async function () {
      const { transactionMeta: txMeta, result } =
        await txController.addTransaction({
          from: selectedAddress,
          to: recipientAddress,
        });
      await result;
      await txController.createSpeedUpTransaction(
        txMeta.id,
        {},
        { actionId: 12345 },
      );
      const transactionCount1 =
        txController.txStateManager.getTransactions().length;
      await txController.createSpeedUpTransaction(
        txMeta.id,
        {},
        { actionId: 12345 },
      );
      const transactionCount2 =
        txController.txStateManager.getTransactions().length;
      assert.equal(transactionCount1, transactionCount2);
    });

    it('should add multiple transactions when called with different actionId', async function () {
      const { transactionMeta: txMeta, result } =
        await txController.addTransaction({
          from: selectedAddress,
          to: recipientAddress,
        });
      await result;
      await txController.createSpeedUpTransaction(
        txMeta.id,
        {},
        { actionId: 12345 },
      );
      const transactionCount1 =
        txController.txStateManager.getTransactions().length;
      await txController.createSpeedUpTransaction(
        txMeta.id,
        {},
        { actionId: 11111 },
      );
      const transactionCount2 =
        txController.txStateManager.getTransactions().length;
      assert.equal(transactionCount1 + 1, transactionCount2);
    });

    it('should add multiple transactions when called with different actionId and txMethodType defined', async function () {
      const { transactionMeta: txMeta, result } =
        await txController.addTransaction(
          {
            from: selectedAddress,
            to: recipientAddress,
          },
          { method: 'eth_sendTransaction' },
        );
      await result;
      await txController.createSpeedUpTransaction(
        txMeta.id,
        {},
        { actionId: 12345 },
      );
      const transactionCount1 =
        txController.txStateManager.getTransactions().length;
      await txController.createSpeedUpTransaction(
        txMeta.id,
        {},
        { actionId: 11111 },
      );
      const transactionCount2 =
        txController.txStateManager.getTransactions().length;
      assert.equal(transactionCount1 + 1, transactionCount2);
    });

    it('should call securityProviderRequest and have flagAsDangerous inside txMeta', async function () {
      const { transactionMeta: txMeta } = await txController.addTransaction(
        {
          from: selectedAddress,
          to: recipientAddress,
        },
        { method: 'eth_sendTransaction' },
      );

      assert.ok(
        'securityProviderResponse' in txMeta,
        'should have a securityProviderResponse',
      );
    });
  });

  describe('#signTransaction', function () {
    let fromTxDataSpy;

    beforeEach(function () {
      fromTxDataSpy = sinon.spy(TransactionFactory, 'fromTxData');
    });

    afterEach(function () {
      fromTxDataSpy.restore();
    });

    it('sets txParams.type to 0x0 (non-EIP-1559)', async function () {
      txController.txStateManager._addTransactionsToState([
        {
          status: TransactionStatus.unapproved,
          id: 1,
          metamaskNetworkId: currentNetworkId,
          history: [{}],
          txParams: {
            from: VALID_ADDRESS_TWO,
            to: VALID_ADDRESS,
            gasPrice: '0x77359400',
            gas: '0x7b0d',
            nonce: '0x4b',
          },
        },
      ]);
      await txController._signTransaction('1');
      assert.equal(fromTxDataSpy.getCall(0).args[0].type, '0x0');
    });

    it('sets txParams.type to 0x2 (EIP-1559)', async function () {
      const eip1559CompatibilityStub = sinon
        .stub(txController, '_getEIP1559Compatibility')
        .returns(true);
      txController.txStateManager._addTransactionsToState([
        {
          status: TransactionStatus.unapproved,
          id: 2,
          metamaskNetworkId: currentNetworkId,
          history: [{}],
          txParams: {
            from: VALID_ADDRESS_TWO,
            to: VALID_ADDRESS,
            maxFeePerGas: '0x77359400',
            maxPriorityFeePerGas: '0x77359400',
            gas: '0x7b0d',
            nonce: '0x4b',
          },
        },
      ]);
      await txController._signTransaction('2');
      assert.equal(fromTxDataSpy.getCall(0).args[0].type, '0x2');
      eip1559CompatibilityStub.restore();
    });
  });

  describe('_publishTransaction', function () {
    let hash, txMeta, trackTransactionMetricsEventSpy;

    beforeEach(function () {
      hash =
        '0x2a5523c6fa98b47b7d9b6c8320179785150b42a16bcff36b398c5062b65657e8';
      txMeta = {
        id: 1,
        status: TransactionStatus.unapproved,
        txParams: {
          gas: '0x7b0d',
          to: VALID_ADDRESS,
          from: VALID_ADDRESS_TWO,
        },
        metamaskNetworkId: currentNetworkId,
      };
      providerResultStub.eth_sendRawTransaction = hash;
      trackTransactionMetricsEventSpy = sinon.spy(
        txController,
        '_trackTransactionMetricsEvent',
      );
    });

    afterEach(function () {
      trackTransactionMetricsEventSpy.restore();
    });

    it('should publish a tx, updates the rawTx when provided a one', async function () {
      const rawTx =
        '0x477b2e6553c917af0db0388ae3da62965ff1a184558f61b749d1266b2e6d024c';
      txController.txStateManager.addTransaction(txMeta);
      await txController._publishTransaction(txMeta.id, rawTx);
      const publishedTx = txController.txStateManager.getTransaction(1);
      assert.equal(publishedTx.hash, hash);
      assert.equal(publishedTx.status, TransactionStatus.submitted);
    });

    it('should ignore the error "Transaction Failed: known transaction" and be as usual', async function () {
      providerResultStub.eth_sendRawTransaction = async (_, __, ___, end) => {
        end('Transaction Failed: known transaction');
      };
      const rawTx =
        '0xf86204831e848082520894f231d46dd78806e1dd93442cf33c7671f853874880802ca05f973e540f2d3c2f06d3725a626b75247593cb36477187ae07ecfe0a4db3cf57a00259b52ee8c58baaa385fb05c3f96116e58de89bcc165cb3bfdfc708672fed8a';
      txController.txStateManager.addTransaction(txMeta);
      await txController._publishTransaction(txMeta.id, rawTx);
      const publishedTx = txController.txStateManager.getTransaction(1);
      assert.equal(
        publishedTx.hash,
        '0x2cc5a25744486f7383edebbf32003e5a66e18135799593d6b5cdd2bb43674f09',
      );
      assert.equal(publishedTx.status, TransactionStatus.submitted);
    });

    it('should call _trackTransactionMetricsEvent with the correct params', async function () {
      const rawTx =
        '0x477b2e6553c917af0db0388ae3da62965ff1a184558f61b749d1266b2e6d024c';
      txController.txStateManager.addTransaction(txMeta);
      await txController._publishTransaction(txMeta.id, rawTx);
      assert.equal(trackTransactionMetricsEventSpy.callCount, 1);
      assert.deepEqual(
        trackTransactionMetricsEventSpy.getCall(0).args[0],
        txMeta,
      );
      assert.equal(
        trackTransactionMetricsEventSpy.getCall(0).args[1],
        TransactionMetaMetricsEvent.submitted,
      );
    });
  });

  describe('#_markNonceDuplicatesDropped', function () {
    it('should mark all nonce duplicates as dropped without marking the confirmed transaction as dropped', function () {
      txController.txStateManager._addTransactionsToState([
        {
          id: 1,
          status: TransactionStatus.confirmed,
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
          status: TransactionStatus.submitted,
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
          status: TransactionStatus.submitted,
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
          status: TransactionStatus.submitted,
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
          status: TransactionStatus.submitted,
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
          status: TransactionStatus.submitted,
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
          status: TransactionStatus.submitted,
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
          status: TransactionStatus.dropped,
        },
      });
      assert.equal(
        confirmedTx.status,
        TransactionStatus.confirmed,
        'the confirmedTx should remain confirmed',
      );
      assert.equal(droppedTxs.length, 6, 'their should be 6 dropped txs');
    });
  });

  describe('#getPendingTransactions', function () {
    it('should show only submitted and approved transactions as pending transaction', function () {
      txController.txStateManager._addTransactionsToState([
        {
          id: 1,
          status: TransactionStatus.unapproved,
          metamaskNetworkId: currentNetworkId,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
        },
        {
          id: 2,
          status: TransactionStatus.rejected,
          metamaskNetworkId: currentNetworkId,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          history: [{}],
        },
        {
          id: 3,
          status: TransactionStatus.approved,
          metamaskNetworkId: currentNetworkId,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          history: [{}],
        },
        {
          id: 4,
          status: TransactionStatus.signed,
          metamaskNetworkId: currentNetworkId,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          history: [{}],
        },
        {
          id: 5,
          status: TransactionStatus.submitted,
          metamaskNetworkId: currentNetworkId,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          history: [{}],
        },
        {
          id: 6,
          status: TransactionStatus.confirmed,
          metamaskNetworkId: currentNetworkId,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          history: [{}],
        },
        {
          id: 7,
          status: TransactionStatus.failed,
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
        states.includes(TransactionStatus.approved),
        'includes approved',
      );
      assert.ok(
        states.includes(TransactionStatus.submitted),
        'includes submitted',
      );
    });
  });

  describe('#_trackTransactionMetricsEvent', function () {
    let trackMetaMetricsEventSpy;
    let createEventFragmentSpy;
    let finalizeEventFragmentSpy;

    beforeEach(function () {
      trackMetaMetricsEventSpy = sinon.spy(
        txController,
        '_trackMetaMetricsEvent',
      );

      createEventFragmentSpy = sinon.spy(txController, 'createEventFragment');

      finalizeEventFragmentSpy = sinon.spy(
        txController,
        'finalizeEventFragment',
      );

      sinon
        .stub(txController, '_getEIP1559GasFeeEstimates')
        .resolves(mockEstimates['fee-market']);
    });

    afterEach(function () {
      trackMetaMetricsEventSpy.restore();
      createEventFragmentSpy.restore();
      finalizeEventFragmentSpy.restore();
    });

    describe('On transaction created by the user', function () {
      let txMeta;

      before(function () {
        txMeta = {
          id: 1,
          status: TransactionStatus.unapproved,
          txParams: {
            from: fromAccount.address,
            to: '0x1678a085c290ebd122dc42cba69373b5953b831d',
            gasPrice: '0x77359400',
            gas: '0x7b0d',
            nonce: '0x4b',
          },
          type: TransactionType.simpleSend,
          origin: ORIGIN_METAMASK,
          chainId: currentChainId,
          time: 1624408066355,
          metamaskNetworkId: currentNetworkId,
          defaultGasEstimates: {
            gas: '0x7b0d',
            gasPrice: '0x77359400',
          },
          securityProviderResponse: {
            flagAsDangerous: 0,
          },
        };
      });

      it('should create an event fragment when transaction added', async function () {
        const expectedPayload = {
          actionId,
          initialEvent: 'Transaction Added',
          successEvent: 'Transaction Approved',
          failureEvent: 'Transaction Rejected',
          uniqueIdentifier: 'transaction-added-1',
          category: MetaMetricsEventCategory.Transactions,
          persist: true,
          properties: {
            chain_id: '0x5',
            eip_1559_version: '0',
            gas_edit_attempted: 'none',
            gas_edit_type: 'none',
            network: '5',
            referrer: ORIGIN_METAMASK,
            source: MetaMetricsTransactionEventSource.User,
            transaction_type: TransactionType.simpleSend,
            account_type: 'MetaMask',
            asset_type: AssetType.native,
            token_standard: TokenStandard.none,
            device_model: 'N/A',
            transaction_speed_up: false,
            ui_customizations: null,
            security_alert_reason: BlockaidReason.notApplicable,
            security_alert_response: BlockaidResultType.NotApplicable,
            status: 'unapproved',
          },
          sensitiveProperties: {
            default_gas: '0.000031501',
            default_gas_price: '2',
            gas_price: '2',
            gas_limit: '0x7b0d',
            transaction_contract_method: undefined,
            transaction_replaced: undefined,
            first_seen: 1624408066355,
            transaction_envelope_type: TRANSACTION_ENVELOPE_TYPE_NAMES.LEGACY,
          },
        };

        await txController._trackTransactionMetricsEvent(
          txMeta,
          TransactionMetaMetricsEvent.added,
          actionId,
        );
        assert.equal(createEventFragmentSpy.callCount, 1);
        assert.equal(finalizeEventFragmentSpy.callCount, 0);
        assert.deepEqual(
          createEventFragmentSpy.getCall(0).args[0],
          expectedPayload,
        );
      });

      it('Should finalize the transaction added fragment as abandoned if user rejects transaction', async function () {
        fragmentExists = true;
        await txController._trackTransactionMetricsEvent(
          txMeta,
          TransactionMetaMetricsEvent.rejected,
          actionId,
        );
        assert.equal(createEventFragmentSpy.callCount, 0);
        assert.equal(finalizeEventFragmentSpy.callCount, 1);
        assert.deepEqual(
          finalizeEventFragmentSpy.getCall(0).args[0],
          'transaction-added-1',
        );
        assert.deepEqual(finalizeEventFragmentSpy.getCall(0).args[1], {
          abandoned: true,
        });
      });

      it('Should finalize the transaction added fragment if user approves transaction', async function () {
        fragmentExists = true;
        await txController._trackTransactionMetricsEvent(
          txMeta,
          TransactionMetaMetricsEvent.approved,
          actionId,
        );
        assert.equal(createEventFragmentSpy.callCount, 0);
        assert.equal(finalizeEventFragmentSpy.callCount, 1);
        assert.deepEqual(
          finalizeEventFragmentSpy.getCall(0).args[0],
          'transaction-added-1',
        );
        assert.deepEqual(
          finalizeEventFragmentSpy.getCall(0).args[1],
          undefined,
        );
      });

      it('should create an event fragment when transaction is submitted', async function () {
        const expectedPayload = {
          actionId,
          initialEvent: 'Transaction Submitted',
          successEvent: 'Transaction Finalized',
          uniqueIdentifier: 'transaction-submitted-1',
          category: MetaMetricsEventCategory.Transactions,
          persist: true,
          properties: {
            chain_id: '0x5',
            eip_1559_version: '0',
            gas_edit_attempted: 'none',
            gas_edit_type: 'none',
            network: '5',
            referrer: ORIGIN_METAMASK,
            source: MetaMetricsTransactionEventSource.User,
            transaction_type: TransactionType.simpleSend,
            account_type: 'MetaMask',
            asset_type: AssetType.native,
            token_standard: TokenStandard.none,
            device_model: 'N/A',
            transaction_speed_up: false,
            ui_customizations: null,
            security_alert_reason: BlockaidReason.notApplicable,
            security_alert_response: BlockaidResultType.NotApplicable,
            status: 'unapproved',
          },
          sensitiveProperties: {
            default_gas: '0.000031501',
            default_gas_price: '2',
            gas_price: '2',
            gas_limit: '0x7b0d',
            transaction_contract_method: undefined,
            transaction_replaced: undefined,
            first_seen: 1624408066355,
            transaction_envelope_type: TRANSACTION_ENVELOPE_TYPE_NAMES.LEGACY,
          },
        };

        await txController._trackTransactionMetricsEvent(
          txMeta,
          TransactionMetaMetricsEvent.submitted,
          actionId,
        );
        assert.equal(createEventFragmentSpy.callCount, 1);
        assert.equal(finalizeEventFragmentSpy.callCount, 0);
        assert.deepEqual(
          createEventFragmentSpy.getCall(0).args[0],
          expectedPayload,
        );
      });

      it('Should finalize the transaction submitted fragment when transaction finalizes', async function () {
        fragmentExists = true;
        await txController._trackTransactionMetricsEvent(
          txMeta,
          TransactionMetaMetricsEvent.finalized,
          actionId,
        );
        assert.equal(createEventFragmentSpy.callCount, 0);
        assert.equal(finalizeEventFragmentSpy.callCount, 1);
        assert.deepEqual(
          finalizeEventFragmentSpy.getCall(0).args[0],
          'transaction-submitted-1',
        );
        assert.deepEqual(
          finalizeEventFragmentSpy.getCall(0).args[1],
          undefined,
        );
      });
    });

    describe('On transaction suggested by dapp', function () {
      let txMeta;
      before(function () {
        txMeta = {
          id: 1,
          status: TransactionStatus.unapproved,
          txParams: {
            from: fromAccount.address,
            to: '0x1678a085c290ebd122dc42cba69373b5953b831d',
            gasPrice: '0x77359400',
            gas: '0x7b0d',
            nonce: '0x4b',
          },
          type: TransactionType.simpleSend,
          origin: 'other',
          chainId: currentChainId,
          time: 1624408066355,
          metamaskNetworkId: currentNetworkId,
          defaultGasEstimates: {
            gas: '0x7b0d',
            gasPrice: '0x77359400',
          },
          securityProviderResponse: {
            flagAsDangerous: 0,
          },
        };
      });

      it('should create an event fragment when transaction added', async function () {
        const expectedPayload = {
          actionId,
          initialEvent: 'Transaction Added',
          successEvent: 'Transaction Approved',
          failureEvent: 'Transaction Rejected',
          uniqueIdentifier: 'transaction-added-1',
          category: MetaMetricsEventCategory.Transactions,
          persist: true,
          properties: {
            chain_id: '0x5',
            eip_1559_version: '0',
            gas_edit_attempted: 'none',
            gas_edit_type: 'none',
            network: '5',
            referrer: 'other',
            source: MetaMetricsTransactionEventSource.Dapp,
            transaction_type: TransactionType.simpleSend,
            account_type: 'MetaMask',
            asset_type: AssetType.native,
            token_standard: TokenStandard.none,
            device_model: 'N/A',
            transaction_speed_up: false,
            ui_customizations: null,
            security_alert_reason: BlockaidReason.notApplicable,
            security_alert_response: BlockaidResultType.NotApplicable,
            status: 'unapproved',
          },
          sensitiveProperties: {
            default_gas: '0.000031501',
            default_gas_price: '2',
            gas_price: '2',
            gas_limit: '0x7b0d',
            transaction_contract_method: undefined,
            transaction_replaced: undefined,
            first_seen: 1624408066355,
            transaction_envelope_type: TRANSACTION_ENVELOPE_TYPE_NAMES.LEGACY,
          },
        };

        await txController._trackTransactionMetricsEvent(
          txMeta,
          TransactionMetaMetricsEvent.added,
          actionId,
        );
        assert.equal(createEventFragmentSpy.callCount, 1);
        assert.equal(finalizeEventFragmentSpy.callCount, 0);
        assert.deepEqual(
          createEventFragmentSpy.getCall(0).args[0],
          expectedPayload,
        );
      });

      it('Should finalize the transaction added fragment as abandoned if user rejects transaction', async function () {
        fragmentExists = true;

        await txController._trackTransactionMetricsEvent(
          txMeta,
          TransactionMetaMetricsEvent.rejected,
          actionId,
        );
        assert.equal(createEventFragmentSpy.callCount, 0);
        assert.equal(finalizeEventFragmentSpy.callCount, 1);
        assert.deepEqual(
          finalizeEventFragmentSpy.getCall(0).args[0],
          'transaction-added-1',
        );
        assert.deepEqual(finalizeEventFragmentSpy.getCall(0).args[1], {
          abandoned: true,
        });
      });

      it('Should finalize the transaction added fragment if user approves transaction', async function () {
        fragmentExists = true;

        await txController._trackTransactionMetricsEvent(
          txMeta,
          TransactionMetaMetricsEvent.approved,
          actionId,
        );
        assert.equal(createEventFragmentSpy.callCount, 0);
        assert.equal(finalizeEventFragmentSpy.callCount, 1);
        assert.deepEqual(
          finalizeEventFragmentSpy.getCall(0).args[0],
          'transaction-added-1',
        );
        assert.deepEqual(
          finalizeEventFragmentSpy.getCall(0).args[1],
          undefined,
        );
      });

      it('should create an event fragment when transaction is submitted', async function () {
        const expectedPayload = {
          actionId,
          initialEvent: 'Transaction Submitted',
          successEvent: 'Transaction Finalized',
          uniqueIdentifier: 'transaction-submitted-1',
          category: MetaMetricsEventCategory.Transactions,
          persist: true,
          properties: {
            chain_id: '0x5',
            eip_1559_version: '0',
            gas_edit_attempted: 'none',
            gas_edit_type: 'none',
            network: '5',
            referrer: 'other',
            source: MetaMetricsTransactionEventSource.Dapp,
            transaction_type: TransactionType.simpleSend,
            account_type: 'MetaMask',
            asset_type: AssetType.native,
            token_standard: TokenStandard.none,
            device_model: 'N/A',
            transaction_speed_up: false,
            ui_customizations: null,
            security_alert_reason: BlockaidReason.notApplicable,
            security_alert_response: BlockaidResultType.NotApplicable,
            status: 'unapproved',
          },
          sensitiveProperties: {
            default_gas: '0.000031501',
            default_gas_price: '2',
            gas_price: '2',
            gas_limit: '0x7b0d',
            transaction_contract_method: undefined,
            transaction_replaced: undefined,
            first_seen: 1624408066355,
            transaction_envelope_type: TRANSACTION_ENVELOPE_TYPE_NAMES.LEGACY,
          },
        };

        await txController._trackTransactionMetricsEvent(
          txMeta,
          TransactionMetaMetricsEvent.submitted,
          actionId,
        );
        assert.equal(createEventFragmentSpy.callCount, 1);
        assert.equal(finalizeEventFragmentSpy.callCount, 0);
        assert.deepEqual(
          createEventFragmentSpy.getCall(0).args[0],
          expectedPayload,
        );
      });

      it('Should finalize the transaction submitted fragment when transaction finalizes', async function () {
        fragmentExists = true;

        await txController._trackTransactionMetricsEvent(
          txMeta,
          TransactionMetaMetricsEvent.finalized,
          actionId,
        );
        assert.equal(createEventFragmentSpy.callCount, 0);
        assert.equal(finalizeEventFragmentSpy.callCount, 1);
        assert.deepEqual(
          finalizeEventFragmentSpy.getCall(0).args[0],
          'transaction-submitted-1',
        );
        assert.deepEqual(
          finalizeEventFragmentSpy.getCall(0).args[1],
          undefined,
        );
      });
    });

    it('should create missing fragments when events happen out of order or are missing', async function () {
      const txMeta = {
        id: 1,
        status: TransactionStatus.unapproved,
        txParams: {
          from: fromAccount.address,
          to: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          gasPrice: '0x77359400',
          gas: '0x7b0d',
          nonce: '0x4b',
        },
        type: TransactionType.simpleSend,
        origin: 'other',
        chainId: currentChainId,
        time: 1624408066355,
        metamaskNetworkId: currentNetworkId,
        securityProviderResponse: {
          flagAsDangerous: 0,
        },
        securityAlertResponse: {
          security_alert_reason: BlockaidReason.notApplicable,
          security_alert_response: BlockaidResultType.NotApplicable,
        },
      };

      const expectedPayload = {
        actionId,
        successEvent: 'Transaction Approved',
        failureEvent: 'Transaction Rejected',
        uniqueIdentifier: 'transaction-added-1',
        category: MetaMetricsEventCategory.Transactions,
        persist: true,
        properties: {
          chain_id: '0x5',
          eip_1559_version: '0',
          gas_edit_attempted: 'none',
          gas_edit_type: 'none',
          network: '5',
          referrer: 'other',
          source: MetaMetricsTransactionEventSource.Dapp,
          transaction_type: TransactionType.simpleSend,
          account_type: 'MetaMask',
          asset_type: AssetType.native,
          token_standard: TokenStandard.none,
          device_model: 'N/A',
          transaction_speed_up: false,
          ui_customizations: null,
          security_alert_reason: BlockaidReason.notApplicable,
          security_alert_response: BlockaidResultType.NotApplicable,
          status: 'unapproved',
        },
        sensitiveProperties: {
          gas_price: '2',
          gas_limit: '0x7b0d',
          transaction_contract_method: undefined,
          transaction_replaced: undefined,
          first_seen: 1624408066355,
          transaction_envelope_type: TRANSACTION_ENVELOPE_TYPE_NAMES.LEGACY,
        },
      };
      await txController._trackTransactionMetricsEvent(
        txMeta,
        TransactionMetaMetricsEvent.approved,
        actionId,
      );
      assert.equal(createEventFragmentSpy.callCount, 1);
      assert.deepEqual(
        createEventFragmentSpy.getCall(0).args[0],
        expectedPayload,
      );
      assert.equal(finalizeEventFragmentSpy.callCount, 1);
      assert.deepEqual(
        finalizeEventFragmentSpy.getCall(0).args[0],
        'transaction-added-1',
      );
      assert.deepEqual(finalizeEventFragmentSpy.getCall(0).args[1], undefined);
    });

    it('should call _trackMetaMetricsEvent with the correct payload (extra params)', async function () {
      const txMeta = {
        id: 1,
        status: TransactionStatus.unapproved,
        txParams: {
          from: fromAccount.address,
          to: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          gasPrice: '0x77359400',
          gas: '0x7b0d',
          nonce: '0x4b',
        },
        type: TransactionType.simpleSend,
        origin: 'other',
        chainId: currentChainId,
        time: 1624408066355,
        metamaskNetworkId: currentNetworkId,
        securityProviderResponse: {
          flagAsDangerous: 0,
        },
      };
      const expectedPayload = {
        actionId,
        initialEvent: 'Transaction Added',
        successEvent: 'Transaction Approved',
        failureEvent: 'Transaction Rejected',
        uniqueIdentifier: 'transaction-added-1',
        persist: true,
        category: MetaMetricsEventCategory.Transactions,
        properties: {
          network: '5',
          referrer: 'other',
          source: MetaMetricsTransactionEventSource.Dapp,
          transaction_type: TransactionType.simpleSend,
          chain_id: '0x5',
          eip_1559_version: '0',
          gas_edit_attempted: 'none',
          gas_edit_type: 'none',
          account_type: 'MetaMask',
          asset_type: AssetType.native,
          token_standard: TokenStandard.none,
          device_model: 'N/A',
          transaction_speed_up: false,
          ui_customizations: null,
          security_alert_reason: BlockaidReason.notApplicable,
          security_alert_response: BlockaidResultType.NotApplicable,
          status: 'unapproved',
        },
        sensitiveProperties: {
          baz: 3.0,
          foo: 'bar',
          gas_price: '2',
          gas_limit: '0x7b0d',
          transaction_contract_method: undefined,
          transaction_replaced: undefined,
          first_seen: 1624408066355,
          transaction_envelope_type: TRANSACTION_ENVELOPE_TYPE_NAMES.LEGACY,
        },
      };

      await txController._trackTransactionMetricsEvent(
        txMeta,
        TransactionMetaMetricsEvent.added,
        actionId,
        {
          baz: 3.0,
          foo: 'bar',
        },
      );
      assert.equal(createEventFragmentSpy.callCount, 1);
      assert.equal(finalizeEventFragmentSpy.callCount, 0);
      assert.deepEqual(
        createEventFragmentSpy.getCall(0).args[0],
        expectedPayload,
      );
    });

    it('should call _trackMetaMetricsEvent with the correct payload when blockaid verification fails', async function () {
      const txMeta = {
        id: 1,
        status: TransactionStatus.unapproved,
        txParams: {
          from: fromAccount.address,
          to: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          gasPrice: '0x77359400',
          gas: '0x7b0d',
          nonce: '0x4b',
        },
        type: TransactionType.simpleSend,
        origin: 'other',
        chainId: currentChainId,
        time: 1624408066355,
        metamaskNetworkId: currentNetworkId,
        securityAlertResponse: {
          result_type: BlockaidResultType.Failed,
          reason: 'some error',
        },
      };
      const expectedPayload = {
        actionId,
        initialEvent: 'Transaction Added',
        successEvent: 'Transaction Approved',
        failureEvent: 'Transaction Rejected',
        uniqueIdentifier: 'transaction-added-1',
        persist: true,
        category: MetaMetricsEventCategory.Transactions,
        properties: {
          network: '5',
          referrer: 'other',
          source: MetaMetricsTransactionEventSource.Dapp,
          status: 'unapproved',
          transaction_type: TransactionType.simpleSend,
          chain_id: '0x5',
          eip_1559_version: '0',
          gas_edit_attempted: 'none',
          gas_edit_type: 'none',
          account_type: 'MetaMask',
          asset_type: AssetType.native,
          token_standard: TokenStandard.none,
          device_model: 'N/A',
          transaction_speed_up: false,
          ui_customizations: ['security_alert_failed'],
          security_alert_reason: 'some error',
          security_alert_response: BlockaidResultType.Failed,
        },
        sensitiveProperties: {
          baz: 3.0,
          foo: 'bar',
          gas_price: '2',
          gas_limit: '0x7b0d',
          transaction_contract_method: undefined,
          transaction_replaced: undefined,
          first_seen: 1624408066355,
          transaction_envelope_type: TRANSACTION_ENVELOPE_TYPE_NAMES.LEGACY,
        },
      };

      await txController._trackTransactionMetricsEvent(
        txMeta,
        TransactionMetaMetricsEvent.added,
        actionId,
        {
          baz: 3.0,
          foo: 'bar',
        },
      );
      assert.equal(createEventFragmentSpy.callCount, 1);
      assert.equal(finalizeEventFragmentSpy.callCount, 0);
      assert.deepEqual(
        createEventFragmentSpy.getCall(0).args[0],
        expectedPayload,
      );
    });

    it('should call _trackMetaMetricsEvent with the correct payload (extra params) when flagAsDangerous is malicious', async function () {
      const txMeta = {
        id: 1,
        status: TransactionStatus.unapproved,
        txParams: {
          from: fromAccount.address,
          to: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          gasPrice: '0x77359400',
          gas: '0x7b0d',
          nonce: '0x4b',
        },
        type: TransactionType.simpleSend,
        origin: 'other',
        chainId: currentChainId,
        time: 1624408066355,
        metamaskNetworkId: currentNetworkId,
        securityProviderResponse: {
          flagAsDangerous: 1,
        },
      };
      const expectedPayload = {
        actionId,
        initialEvent: 'Transaction Added',
        successEvent: 'Transaction Approved',
        failureEvent: 'Transaction Rejected',
        uniqueIdentifier: 'transaction-added-1',
        persist: true,
        category: MetaMetricsEventCategory.Transactions,
        properties: {
          network: '5',
          referrer: 'other',
          source: MetaMetricsTransactionEventSource.Dapp,
          transaction_type: TransactionType.simpleSend,
          chain_id: '0x5',
          eip_1559_version: '0',
          gas_edit_attempted: 'none',
          gas_edit_type: 'none',
          account_type: 'MetaMask',
          asset_type: AssetType.native,
          token_standard: TokenStandard.none,
          device_model: 'N/A',
          transaction_speed_up: false,
          ui_customizations: ['flagged_as_malicious'],
          security_alert_reason: BlockaidReason.notApplicable,
          security_alert_response: BlockaidResultType.NotApplicable,
          status: 'unapproved',
        },
        sensitiveProperties: {
          baz: 3.0,
          foo: 'bar',
          gas_price: '2',
          gas_limit: '0x7b0d',
          transaction_contract_method: undefined,
          transaction_replaced: undefined,
          first_seen: 1624408066355,
          transaction_envelope_type: TRANSACTION_ENVELOPE_TYPE_NAMES.LEGACY,
        },
      };

      await txController._trackTransactionMetricsEvent(
        txMeta,
        TransactionMetaMetricsEvent.added,
        actionId,
        {
          baz: 3.0,
          foo: 'bar',
        },
      );
      assert.equal(createEventFragmentSpy.callCount, 1);
      assert.equal(finalizeEventFragmentSpy.callCount, 0);
      assert.deepEqual(
        createEventFragmentSpy.getCall(0).args[0],
        expectedPayload,
      );
    });

    it('should call _trackMetaMetricsEvent with the correct payload (extra params) when flagAsDangerous is unknown', async function () {
      const txMeta = {
        id: 1,
        status: TransactionStatus.unapproved,
        txParams: {
          from: fromAccount.address,
          to: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          gasPrice: '0x77359400',
          gas: '0x7b0d',
          nonce: '0x4b',
        },
        type: TransactionType.simpleSend,
        origin: 'other',
        chainId: currentChainId,
        time: 1624408066355,
        metamaskNetworkId: currentNetworkId,
        securityProviderResponse: {
          flagAsDangerous: 2,
        },
      };
      const expectedPayload = {
        actionId,
        initialEvent: 'Transaction Added',
        successEvent: 'Transaction Approved',
        failureEvent: 'Transaction Rejected',
        uniqueIdentifier: 'transaction-added-1',
        persist: true,
        category: MetaMetricsEventCategory.Transactions,
        properties: {
          network: '5',
          referrer: 'other',
          source: MetaMetricsTransactionEventSource.Dapp,
          transaction_type: TransactionType.simpleSend,
          chain_id: '0x5',
          eip_1559_version: '0',
          gas_edit_attempted: 'none',
          gas_edit_type: 'none',
          account_type: 'MetaMask',
          asset_type: AssetType.native,
          token_standard: TokenStandard.none,
          device_model: 'N/A',
          transaction_speed_up: false,
          ui_customizations: ['flagged_as_safety_unknown'],
          security_alert_reason: BlockaidReason.notApplicable,
          security_alert_response: BlockaidResultType.NotApplicable,
          status: 'unapproved',
        },
        sensitiveProperties: {
          baz: 3.0,
          foo: 'bar',
          gas_price: '2',
          gas_limit: '0x7b0d',
          transaction_contract_method: undefined,
          transaction_replaced: undefined,
          first_seen: 1624408066355,
          transaction_envelope_type: TRANSACTION_ENVELOPE_TYPE_NAMES.LEGACY,
        },
      };

      await txController._trackTransactionMetricsEvent(
        txMeta,
        TransactionMetaMetricsEvent.added,
        actionId,
        {
          baz: 3.0,
          foo: 'bar',
        },
      );
      assert.equal(createEventFragmentSpy.callCount, 1);
      assert.equal(finalizeEventFragmentSpy.callCount, 0);
      assert.deepEqual(
        createEventFragmentSpy.getCall(0).args[0],
        expectedPayload,
      );
    });

    it('should call _trackMetaMetricsEvent with the correct payload (EIP-1559)', async function () {
      const txMeta = {
        id: 1,
        status: TransactionStatus.unapproved,
        txParams: {
          from: fromAccount.address,
          to: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          maxFeePerGas: '0x77359400',
          maxPriorityFeePerGas: '0x77359400',
          gas: '0x7b0d',
          nonce: '0x4b',
          estimateSuggested: GasRecommendations.medium,
          estimateUsed: GasRecommendations.high,
        },
        type: TransactionType.simpleSend,
        origin: 'other',
        chainId: currentChainId,
        time: 1624408066355,
        metamaskNetworkId: currentNetworkId,
        defaultGasEstimates: {
          estimateType: 'medium',
          maxFeePerGas: '0x77359400',
          maxPriorityFeePerGas: '0x77359400',
        },
        securityProviderResponse: {
          flagAsDangerous: 0,
        },
      };
      const expectedPayload = {
        actionId,
        initialEvent: 'Transaction Added',
        successEvent: 'Transaction Approved',
        failureEvent: 'Transaction Rejected',
        uniqueIdentifier: 'transaction-added-1',
        persist: true,
        category: MetaMetricsEventCategory.Transactions,
        properties: {
          chain_id: '0x5',
          eip_1559_version: '2',
          gas_edit_attempted: 'none',
          gas_edit_type: 'none',
          network: '5',
          referrer: 'other',
          source: MetaMetricsTransactionEventSource.Dapp,
          transaction_type: TransactionType.simpleSend,
          account_type: 'MetaMask',
          asset_type: AssetType.native,
          token_standard: TokenStandard.none,
          device_model: 'N/A',
          transaction_speed_up: false,
          ui_customizations: null,
          security_alert_reason: BlockaidReason.notApplicable,
          security_alert_response: BlockaidResultType.NotApplicable,
          status: 'unapproved',
        },
        sensitiveProperties: {
          baz: 3.0,
          foo: 'bar',
          max_fee_per_gas: '2',
          max_priority_fee_per_gas: '2',
          gas_limit: '0x7b0d',
          transaction_contract_method: undefined,
          transaction_replaced: undefined,
          first_seen: 1624408066355,
          transaction_envelope_type: TRANSACTION_ENVELOPE_TYPE_NAMES.FEE_MARKET,
          estimate_suggested: GasRecommendations.medium,
          estimate_used: GasRecommendations.high,
          default_estimate: 'medium',
          default_max_fee_per_gas: '70',
          default_max_priority_fee_per_gas: '7',
        },
      };

      await txController._trackTransactionMetricsEvent(
        txMeta,
        TransactionMetaMetricsEvent.added,
        actionId,
        {
          baz: 3.0,
          foo: 'bar',
        },
      );
      assert.equal(createEventFragmentSpy.callCount, 1);
      assert.equal(finalizeEventFragmentSpy.callCount, 0);
      assert.deepEqual(
        createEventFragmentSpy.getCall(0).args[0],
        expectedPayload,
      );
    });
  });

  describe('#_getTransactionCompletionTime', function () {
    let nowStub;

    beforeEach(function () {
      nowStub = sinon.stub(Date, 'now').returns(1625782016341);
    });

    afterEach(function () {
      nowStub.restore();
    });

    it('calculates completion time (one)', function () {
      const submittedTime = 1625781997397;
      const result = txController._getTransactionCompletionTime(submittedTime);
      assert.equal(result, '19');
    });

    it('calculates completion time (two)', function () {
      const submittedTime = 1625781995397;
      const result = txController._getTransactionCompletionTime(submittedTime);
      assert.equal(result, '21');
    });
  });

  describe('#_getGasValuesInGWEI', function () {
    it('converts gas values in hex GWEi to dec GWEI (EIP-1559)', function () {
      const params = {
        max_fee_per_gas: '0x77359400',
        max_priority_fee_per_gas: '0x77359400',
      };
      const expectedParams = {
        max_fee_per_gas: '2',
        max_priority_fee_per_gas: '2',
      };
      const result = txController._getGasValuesInGWEI(params);
      assert.deepEqual(result, expectedParams);
    });

    it('converts gas values in hex GWEi to dec GWEI (non EIP-1559)', function () {
      const params = {
        gas_price: '0x37e11d600',
      };
      const expectedParams = {
        gas_price: '15',
      };
      const result = txController._getGasValuesInGWEI(params);
      assert.deepEqual(result, expectedParams);
    });

    it('converts gas values in hex GWEi to dec GWEI, retains estimate fields', function () {
      const params = {
        max_fee_per_gas: '0x77359400',
        max_priority_fee_per_gas: '0x77359400',
        estimate_suggested: GasRecommendations.medium,
        estimate_used: GasRecommendations.high,
      };
      const expectedParams = {
        max_fee_per_gas: '2',
        max_priority_fee_per_gas: '2',
        estimate_suggested: GasRecommendations.medium,
        estimate_used: GasRecommendations.high,
      };
      const result = txController._getGasValuesInGWEI(params);
      assert.deepEqual(result, expectedParams);
    });
  });

  describe('update transaction methods', function () {
    let txStateManager;

    beforeEach(function () {
      txStateManager = txController.txStateManager;
      txStateManager.addTransaction({
        id: '1',
        status: TransactionStatus.unapproved,
        metamaskNetworkId: currentNetworkId,
        txParams: {
          gasLimit: '0x001',
          gasPrice: '0x002',
          // max fees can not be mixed with gasPrice
          // maxPriorityFeePerGas: '0x003',
          // maxFeePerGas: '0x004',
          to: VALID_ADDRESS,
          from: VALID_ADDRESS,
        },
        estimateUsed: '0x005',
        estimatedBaseFee: '0x006',
        decEstimatedBaseFee: '6',
        type: 'swap',
        sourceTokenSymbol: 'ETH',
        destinationTokenSymbol: 'UNI',
        destinationTokenDecimals: 16,
        destinationTokenAddress: VALID_ADDRESS,
        swapMetaData: {},
        swapTokenValue: '0x007',
        userEditedGasLimit: '0x008',
        userFeeLevel: 'medium',
      });
    });

    it('updates transaction gas fees', function () {
      // test update gasFees
      txController.updateTransactionGasFees('1', {
        gasPrice: '0x0022',
        gasLimit: '0x0011',
      });
      let result = txStateManager.getTransaction('1');
      assert.equal(result.txParams.gasPrice, '0x0022');
      // TODO: weird behavior here...only gasPrice gets returned.
      // assert.equal(result.txParams.gasLimit, '0x0011');

      // test update maxPriorityFeePerGas
      txStateManager.addTransaction({
        id: '2',
        status: TransactionStatus.unapproved,
        metamaskNetworkId: currentNetworkId,
        txParams: {
          maxPriorityFeePerGas: '0x003',
          to: VALID_ADDRESS,
          from: VALID_ADDRESS,
        },
        estimateUsed: '0x005',
      });
      txController.updateTransactionGasFees('2', {
        maxPriorityFeePerGas: '0x0033',
      });
      result = txStateManager.getTransaction('2');
      assert.equal(result.txParams.maxPriorityFeePerGas, '0x0033');

      // test update maxFeePerGas
      txStateManager.addTransaction({
        id: '3',
        status: TransactionStatus.unapproved,
        metamaskNetworkId: currentNetworkId,
        txParams: {
          maxPriorityFeePerGas: '0x003',
          maxFeePerGas: '0x004',
          to: VALID_ADDRESS,
          from: VALID_ADDRESS,
        },
        estimateUsed: '0x005',
      });
      txController.updateTransactionGasFees('3', { maxFeePerGas: '0x0044' });
      result = txStateManager.getTransaction('3');
      assert.equal(result.txParams.maxFeePerGas, '0x0044');

      // test update estimate used
      txController.updateTransactionGasFees('3', { estimateUsed: '0x0055' });
      result = txStateManager.getTransaction('3');
      assert.equal(result.estimateUsed, '0x0055');
    });

    it('should not update and should throw error if status is not type "unapproved"', function () {
      txStateManager.addTransaction({
        id: '4',
        status: TransactionStatus.dropped,
        metamaskNetworkId: currentNetworkId,
        txParams: {
          maxPriorityFeePerGas: '0x007',
          maxFeePerGas: '0x008',
          to: VALID_ADDRESS,
          from: VALID_ADDRESS,
        },
        estimateUsed: '0x009',
      });

      assert.throws(
        () =>
          txController.updateTransactionGasFees('4', {
            maxFeePerGas: '0x0088',
          }),
        Error,
        `TransactionsController: Can only call updateTransactionGasFees on an unapproved transaction.
         Current tx status: ${TransactionStatus.dropped}`,
      );

      const transaction = txStateManager.getTransaction('4');
      assert.equal(transaction.txParams.maxFeePerGas, '0x008');
    });

    it('does not update unknown parameters in update method', function () {
      txController.updateTransactionGasFees('1', {
        estimateUsed: '0x13',
        gasPrice: '0x14',
        destinationTokenAddress: VALID_ADDRESS,
      });

      const result = txStateManager.getTransaction('1');
      assert.equal(result.estimateUsed, '0x13');
      assert.equal(result.txParams.gasPrice, '0x14');
      assert.equal(result.destinationTokenAddress, VALID_ADDRESS); // not updated even though it's passed in to update
    });
  });

  describe('updateEditableParams', function () {
    let txStateManager;

    beforeEach(function () {
      txStateManager = txController.txStateManager;
      txStateManager.addTransaction({
        id: '1',
        status: TransactionStatus.unapproved,
        metamaskNetworkId: currentNetworkId,
        txParams: {
          gas: '0x001',
          gasPrice: '0x002',
          // max fees can not be mixed with gasPrice
          // maxPriorityFeePerGas: '0x003',
          // maxFeePerGas: '0x004',
          to: VALID_ADDRESS,
          from: VALID_ADDRESS,
        },
        estimateUsed: '0x005',
        estimatedBaseFee: '0x006',
        decEstimatedBaseFee: '6',
        type: 'simpleSend',
        userEditedGasLimit: '0x008',
        userFeeLevel: 'medium',
      });
    });

    it('updates editible params when type changes from simple send to token transfer', async function () {
      providerResultStub.eth_getCode = '0xab';
      // test update gasFees
      await txController.updateEditableParams('1', {
        data: '0xa9059cbb000000000000000000000000e18035bf8712672935fdb4e5e431b1a0183d2dfc0000000000000000000000000000000000000000000000000de0b6b3a7640000',
      });
      const result = txStateManager.getTransaction('1');
      assert.equal(
        result.txParams.data,
        '0xa9059cbb000000000000000000000000e18035bf8712672935fdb4e5e431b1a0183d2dfc0000000000000000000000000000000000000000000000000de0b6b3a7640000',
      );
      assert.equal(result.type, TransactionType.tokenMethodTransfer);
    });

    it('updates editible params when type changes from token transfer to simple send', async function () {
      // test update gasFees
      txStateManager.addTransaction({
        id: '2',
        status: TransactionStatus.unapproved,
        metamaskNetworkId: currentNetworkId,
        txParams: {
          gas: '0x001',
          gasPrice: '0x002',
          // max fees can not be mixed with gasPrice
          // maxPriorityFeePerGas: '0x003',
          // maxFeePerGas: '0x004',
          to: VALID_ADDRESS,
          from: VALID_ADDRESS,
          data: '0xa9059cbb000000000000000000000000e18035bf8712672935fdb4e5e431b1a0183d2dfc0000000000000000000000000000000000000000000000000de0b6b3a7640000',
        },
        estimateUsed: '0x005',
        estimatedBaseFee: '0x006',
        decEstimatedBaseFee: '6',
        type: TransactionType.tokenMethodTransfer,
        userEditedGasLimit: '0x008',
        userFeeLevel: 'medium',
      });
      await txController.updateEditableParams('2', {
        data: '0x',
      });
      const result = txStateManager.getTransaction('2');
      assert.equal(result.txParams.data, '0x');
      assert.equal(result.type, TransactionType.simpleSend);
    });

    it('updates editible params when type changes from simpleSend to contract interaction', async function () {
      // test update gasFees
      txStateManager.addTransaction({
        id: '3',
        status: TransactionStatus.unapproved,
        metamaskNetworkId: currentNetworkId,
        txParams: {
          gas: '0x001',
          gasPrice: '0x002',
          // max fees can not be mixed with gasPrice
          // maxPriorityFeePerGas: '0x003',
          // maxFeePerGas: '0x004',
          to: VALID_ADDRESS,
          from: VALID_ADDRESS,
        },
        estimateUsed: '0x005',
        estimatedBaseFee: '0x006',
        decEstimatedBaseFee: '6',
        type: TransactionType.tokenMethodTransfer,
        userEditedGasLimit: '0x008',
        userFeeLevel: 'medium',
      });
      providerResultStub.eth_getCode = '0x5';
      await txController.updateEditableParams('3', {
        data: '0x123',
      });
      const result = txStateManager.getTransaction('3');
      assert.equal(result.txParams.data, '0x123');
      assert.equal(result.type, TransactionType.contractInteraction);
    });

    it('updates editible params when type does not change', async function () {
      // test update gasFees
      await txController.updateEditableParams('1', {
        data: '0x123',
        gas: '0xabc',
        from: VALID_ADDRESS_TWO,
      });
      const result = txStateManager.getTransaction('1');
      assert.equal(result.txParams.data, '0x123');
      assert.equal(result.txParams.gas, '0xabc');
      assert.equal(result.txParams.from, VALID_ADDRESS_TWO);
      assert.equal(result.txParams.to, VALID_ADDRESS);
      assert.equal(result.txParams.gasPrice, '0x002');
      assert.equal(result.type, TransactionType.simpleSend);
    });
  });

  describe('initApprovals', function () {
    it('adds unapprovedTxs as approvals', async function () {
      const firstTxId = '1';
      const firstTxMeta = {
        id: firstTxId,
        origin: ORIGIN_METAMASK,
        status: TransactionStatus.unapproved,
        metamaskNetworkId: currentNetworkId,
        txParams: {
          to: VALID_ADDRESS,
          from: VALID_ADDRESS_TWO,
        },
      };

      const secondTxId = '2';
      const secondTxMeta = {
        id: secondTxId,
        origin: ORIGIN_METAMASK,
        status: TransactionStatus.unapproved,
        metamaskNetworkId: currentNetworkId,
        txParams: {
          to: VALID_ADDRESS,
          from: VALID_ADDRESS_TWO,
        },
      };

      txController._addTransaction(firstTxMeta);
      txController._addTransaction(secondTxMeta);

      await txController.initApprovals();

      assert.deepEqual(messengerMock.call.getCall(0).args, [
        'ApprovalController:addRequest',
        {
          id: firstTxId,
          origin: ORIGIN_METAMASK,
          requestData: { txId: firstTxId },
          type: ApprovalType.Transaction,
          expectsResult: true,
        },
        false,
      ]);
      assert.deepEqual(messengerMock.call.getCall(1).args, [
        'ApprovalController:addRequest',
        {
          id: secondTxId,
          origin: ORIGIN_METAMASK,
          requestData: { txId: secondTxId },
          type: ApprovalType.Transaction,
          expectsResult: true,
        },
        false,
      ]);
    });
  });

  describe('#updateTransactionSendFlowHistory', function () {
    it('returns same result after two sequential calls with same history', async function () {
      const txId = 1;

      const txMeta = {
        id: txId,
        origin: ORIGIN_METAMASK,
        status: TransactionStatus.unapproved,
        metamaskNetworkId: currentNetworkId,
        txParams: {
          to: VALID_ADDRESS,
          from: VALID_ADDRESS_TWO,
        },
      };

      txController._addTransaction(txMeta);

      const transaction1 = txController.updateTransactionSendFlowHistory(
        txId,
        2,
        ['foo1', 'foo2'],
      );

      const transaction2 = txController.updateTransactionSendFlowHistory(
        txId,
        2,
        ['foo1', 'foo2'],
      );

      assert.deepEqual(transaction1, transaction2);
    });
  });

  describe('on incoming transaction helper transactions event', function () {
    it('adds new transactions to state', async function () {
      const existingTransaction = TRANSACTION_META_MOCK;

      const incomingTransaction1 = {
        ...TRANSACTION_META_MOCK,
        id: 2,
        hash: '0x2',
      };

      const incomingTransaction2 = {
        ...TRANSACTION_META_MOCK,
        id: 3,
        hash: '0x3',
      };

      txController.store.getState().transactions = {
        [existingTransaction.id]: existingTransaction,
      };

      await incomingTransactionHelperEventMock.firstCall.args[1]({
        added: [incomingTransaction1, incomingTransaction2],
        updated: [],
      });

      assert.deepEqual(txController.store.getState().transactions, {
        [existingTransaction.id]: existingTransaction,
        [incomingTransaction1.id]: incomingTransaction1,
        [incomingTransaction2.id]: incomingTransaction2,
      });
    });

    it('ignores new transactions if hash matches existing transaction', async function () {
      const existingTransaction = TRANSACTION_META_MOCK;
      const incomingTransaction1 = { ...TRANSACTION_META_MOCK, id: 2 };
      const incomingTransaction2 = { ...TRANSACTION_META_MOCK, id: 3 };

      txController.store.getState().transactions = {
        [existingTransaction.id]: existingTransaction,
      };

      await incomingTransactionHelperEventMock.firstCall.args[1]({
        added: [incomingTransaction1, incomingTransaction2],
        updated: [],
      });

      assert.deepEqual(txController.store.getState().transactions, {
        [existingTransaction.id]: existingTransaction,
      });
    });
  });

  describe('on incoming transaction helper updatedLastFetchedBlockNumbers event', function () {
    it('updates state', async function () {
      const lastFetchedBlockNumbers = {
        key: 234,
      };

      assert.deepEqual(
        txController.store.getState().lastFetchedBlockNumbers,
        undefined,
      );

      await incomingTransactionHelperEventMock.secondCall.args[1]({
        lastFetchedBlockNumbers,
      });

      assert.deepEqual(
        txController.store.getState().lastFetchedBlockNumbers,
        lastFetchedBlockNumbers,
      );
    });
  });
});
