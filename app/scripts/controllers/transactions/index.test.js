import { strict as assert } from 'assert';
import EventEmitter from 'events';
import { toBuffer } from 'ethereumjs-util';
import { TransactionFactory } from '@ethereumjs/tx';
import { ObservableStore } from '@metamask/obs-store';
import sinon from 'sinon';

<<<<<<< HEAD
=======
import { errorCodes, ethErrors } from 'eth-rpc-errors';
>>>>>>> upstream/multichain-swaps-controller
import {
  createTestProviderTools,
  getTestAccounts,
} from '../../../../test/stub/provider';
import {
<<<<<<< HEAD
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
} from '../../../../shared/constants/transaction';
import { SECOND } from '../../../../shared/constants/time';
import { GAS_ESTIMATE_TYPES } from '../../../../shared/constants/gas';
import { METAMASK_CONTROLLER_EVENTS } from '../../metamask-controller';
import TransactionController, { TRANSACTION_EVENTS } from '.';
=======
  TransactionStatus,
  TransactionType,
  TransactionEnvelopeType,
} from '../../../../shared/constants/transaction';

import {
  GasEstimateTypes,
  GasRecommendations,
} from '../../../../shared/constants/gas';
import { ORIGIN_METAMASK } from '../../../../shared/constants/app';
import { NetworkStatus } from '../../../../shared/constants/network';
import TxGasUtil from './tx-gas-utils';
import * as IncomingTransactionHelperClass from './IncomingTransactionHelper';
import TransactionController from '.';
>>>>>>> upstream/multichain-swaps-controller

const noop = () => true;
const currentNetworkId = '42';
const currentChainId = '0x2a';
const providerConfig = {
  type: 'kovan',
};
<<<<<<< HEAD

=======
>>>>>>> upstream/multichain-swaps-controller
const VALID_ADDRESS = '0x0000000000000000000000000000000000000000';
const VALID_ADDRESS_TWO = '0x0000000000000000000000000000000000000001';

describe('Transaction Controller', function () {
<<<<<<< HEAD
  let txController, provider, providerResultStub, fromAccount;
=======
  let txController,
    provider,
    providerResultStub,
    fromAccount,
    networkStatusStore,
    preferencesStore,
    getCurrentChainId,
    messengerMock,
    resultCallbacksMock,
    updateSpy,
    incomingTransactionHelperClassMock,
    incomingTransactionHelperEventMock;
>>>>>>> upstream/multichain-swaps-controller

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
<<<<<<< HEAD
      networkStore: new ObservableStore(currentNetworkId),
=======
      getNetworkStatus: () => networkStatusStore.getState(),
      onNetworkStateChange: (listener) =>
        networkStatusStore.subscribe(listener),
>>>>>>> upstream/multichain-swaps-controller
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
      getCurrentChainId: () => currentChainId,
      getParticipateInMetrics: () => false,
<<<<<<< HEAD
      trackMetaMetricsEvent: () => undefined,
      getEIP1559GasFeeEstimates: () => undefined,
=======
      getEIP1559GasFeeEstimates: () => undefined,
      securityProviderRequest: () => undefined,
      preferencesStore,
      messenger: messengerMock,
>>>>>>> upstream/multichain-swaps-controller
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
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.UNAPPROVED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.unapproved,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          history: [{}],
        },
        {
          id: 2,
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.UNAPPROVED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.unapproved,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          history: [{}],
        },
        {
          id: 3,
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.UNAPPROVED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.unapproved,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
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
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.SUBMITTED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.submitted,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          history: [{}],
        },
        {
          id: 2,
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.SUBMITTED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.submitted,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          history: [{}],
        },
        {
          id: 3,
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.SUBMITTED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.submitted,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
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
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.CONFIRMED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.confirmed,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
          txParams,
          history: [{}],
        },
        {
          id: 1,
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.CONFIRMED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.confirmed,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
          txParams,
          history: [{}],
        },
        {
          id: 2,
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.CONFIRMED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.confirmed,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
          txParams,
          history: [{}],
        },
        {
          id: 3,
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.UNAPPROVED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.unapproved,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
          txParams,
          history: [{}],
        },
        {
          id: 4,
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.REJECTED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.rejected,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
          txParams,
          history: [{}],
        },
        {
          id: 5,
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.APPROVED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.approved,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
          txParams,
          history: [{}],
        },
        {
          id: 6,
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.SIGNED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.signed,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
          txParams,
          history: [{}],
        },
        {
          id: 7,
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.SUBMITTED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.submitted,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
          txParams,
          history: [{}],
        },
        {
          id: 8,
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.FAILED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.failed,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
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
        chainId: currentChainId,
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
      assert.ok('chainId' in txMeta, 'should have a chainId');
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
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.UNAPPROVED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.unapproved,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
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

    it('should add EIP1559 tx defaults', async function () {
      const TEST_MAX_FEE_PER_GAS = '0x12a05f200';
      const TEST_MAX_PRIORITY_FEE_PER_GAS = '0x77359400';

      const stub1 = sinon
        .stub(txController, 'getEIP1559Compatibility')
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
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.UNAPPROVED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.unapproved,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
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

      const txMetaWithDefaults = await txController.addTxGasDefaults(txMeta);

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
        .stub(txController, 'getEIP1559Compatibility')
        .returns(true);

      const stub2 = sinon
        .stub(txController, '_getDefaultGasFees')
        .callsFake(() => ({ gasPrice: TEST_GASPRICE }));

      txController.txStateManager._addTransactionsToState([
        {
          id: 1,
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.UNAPPROVED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.unapproved,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
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

      const txMetaWithDefaults = await txController.addTxGasDefaults(txMeta);

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

<<<<<<< HEAD
=======
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
          chainId: currentChainId,
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

>>>>>>> upstream/multichain-swaps-controller
    it('should not add gasPrice if the fee data is available from the dapp', async function () {
      const TEST_GASPRICE = '0x12a05f200';
      const TEST_MAX_FEE_PER_GAS = '0x12a05f200';
      const TEST_MAX_PRIORITY_FEE_PER_GAS = '0x77359400';

      const stub1 = sinon
        .stub(txController, 'getEIP1559Compatibility')
        .returns(true);

      const stub2 = sinon
        .stub(txController, '_getDefaultGasFees')
        .callsFake(() => ({ gasPrice: TEST_GASPRICE }));

      txController.txStateManager._addTransactionsToState([
        {
          id: 1,
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.UNAPPROVED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.unapproved,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
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

      const txMetaWithDefaults = await txController.addTxGasDefaults(txMeta);

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
        gasEstimateType: GAS_ESTIMATE_TYPES.FEE_MARKET,
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
        gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
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
        gasEstimateType: GAS_ESTIMATE_TYPES.ETH_GASPRICE,
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

  describe('#addTransaction', function () {
    let trackTransactionMetricsEventSpy;

    beforeEach(function () {
      trackTransactionMetricsEventSpy = sinon.spy(
        txController,
        '_trackTransactionMetricsEvent',
      );
    });

    afterEach(function () {
      trackTransactionMetricsEventSpy.restore();
    });

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

    it('should call _trackTransactionMetricsEvent with the correct params', function () {
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
        type: 'sentEther',
        transaction_envelope_type: 'legacy',
        origin: 'metamask',
        chainId: currentChainId,
        time: 1624408066355,
        metamaskNetworkId: currentNetworkId,
      };

      txController.addTransaction(txMeta);

      assert.equal(trackTransactionMetricsEventSpy.callCount, 1);
      assert.deepEqual(
        trackTransactionMetricsEventSpy.getCall(0).args[0],
        txMeta,
      );
      assert.equal(
        trackTransactionMetricsEventSpy.getCall(0).args[1],
        TRANSACTION_EVENTS.ADDED,
      );
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
      this.timeout(SECOND * 15);
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
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.UNAPPROVED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.unapproved,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
        },
        noop,
      );
      const rawTx = await txController.signTransaction('1');
      const ethTx = TransactionFactory.fromSerializedData(toBuffer(rawTx));
      assert.equal(ethTx.common.chainIdBN().toNumber(), 42);
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
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.SUBMITTED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.submitted,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
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

      const { previousGasParams, type } = addTransactionArgs;
      assert.deepEqual(
        { gasPrice: previousGasParams.gasPrice, type },
        {
          gasPrice: '0xa',
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

      const { previousGasParams, type } = result;
      assert.deepEqual(
        { gasPrice: previousGasParams.gasPrice, type },
        {
          gasPrice: '0xa',
          type: TRANSACTION_TYPES.RETRY,
        },
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
          status: TRANSACTION_STATUSES.UNAPPROVED,
          id: 1,
          chainId: currentChainId,
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
      await txController.signTransaction('1');
      assert.equal(fromTxDataSpy.getCall(0).args[0].type, '0x0');
    });

    it('sets txParams.type to 0x2 (EIP-1559)', async function () {
      const eip1559CompatibilityStub = sinon
        .stub(txController, 'getEIP1559Compatibility')
        .returns(true);
      txController.txStateManager._addTransactionsToState([
        {
          status: TRANSACTION_STATUSES.UNAPPROVED,
          id: 2,
          chainId: currentChainId,
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
      await txController.signTransaction('2');
      assert.equal(fromTxDataSpy.getCall(0).args[0].type, '0x2');
      eip1559CompatibilityStub.restore();
    });
  });

<<<<<<< HEAD
  describe('#publishTransaction', function () {
    let hash, txMeta, trackTransactionMetricsEventSpy;
=======
  describe('_publishTransaction', function () {
    let hash, txMeta;
>>>>>>> upstream/multichain-swaps-controller

    beforeEach(function () {
      hash =
        '0x2a5523c6fa98b47b7d9b6c8320179785150b42a16bcff36b398c5062b65657e8';
      txMeta = {
        id: 1,
        status: TRANSACTION_STATUSES.UNAPPROVED,
        txParams: {
          gas: '0x7b0d',
          to: VALID_ADDRESS,
          from: VALID_ADDRESS_TWO,
        },
        chainId: currentChainId,
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
<<<<<<< HEAD

    it('should call _trackTransactionMetricsEvent with the correct params', async function () {
      const rawTx =
        '0x477b2e6553c917af0db0388ae3da62965ff1a184558f61b749d1266b2e6d024c';
      txController.txStateManager.addTransaction(txMeta);
      await txController.publishTransaction(txMeta.id, rawTx);
      assert.equal(trackTransactionMetricsEventSpy.callCount, 1);
      assert.deepEqual(
        trackTransactionMetricsEventSpy.getCall(0).args[0],
        txMeta,
      );
      assert.equal(
        trackTransactionMetricsEventSpy.getCall(0).args[1],
        TRANSACTION_EVENTS.SUBMITTED,
      );
    });
=======
>>>>>>> upstream/multichain-swaps-controller
  });

  describe('#_markNonceDuplicatesDropped', function () {
    it('should mark all nonce duplicates as dropped without marking the confirmed transaction as dropped', function () {
      txController.txStateManager._addTransactionsToState([
        {
          id: 1,
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.CONFIRMED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.confirmed,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
          history: [{}],
          txParams: {
            to: VALID_ADDRESS_TWO,
            from: VALID_ADDRESS,
            nonce: '0x01',
          },
        },
        {
          id: 2,
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.SUBMITTED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.submitted,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
          history: [{}],
          txParams: {
            to: VALID_ADDRESS_TWO,
            from: VALID_ADDRESS,
            nonce: '0x01',
          },
        },
        {
          id: 3,
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.SUBMITTED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.submitted,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
          history: [{}],
          txParams: {
            to: VALID_ADDRESS_TWO,
            from: VALID_ADDRESS,
            nonce: '0x01',
          },
        },
        {
          id: 4,
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.SUBMITTED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.submitted,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
          history: [{}],
          txParams: {
            to: VALID_ADDRESS_TWO,
            from: VALID_ADDRESS,
            nonce: '0x01',
          },
        },
        {
          id: 5,
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.SUBMITTED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.submitted,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
          history: [{}],
          txParams: {
            to: VALID_ADDRESS_TWO,
            from: VALID_ADDRESS,
            nonce: '0x01',
          },
        },
        {
          id: 6,
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.SUBMITTED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.submitted,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
          history: [{}],
          txParams: {
            to: VALID_ADDRESS_TWO,
            from: VALID_ADDRESS,
            nonce: '0x01',
          },
        },
        {
          id: 7,
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.SUBMITTED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.submitted,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
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
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.UNAPPROVED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.unapproved,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
        },
        {
          id: 2,
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.REJECTED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.rejected,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          history: [{}],
        },
        {
          id: 3,
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.APPROVED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.approved,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          history: [{}],
        },
        {
          id: 4,
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.SIGNED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.signed,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          history: [{}],
        },
        {
          id: 5,
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.SUBMITTED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.submitted,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          history: [{}],
        },
        {
          id: 6,
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.CONFIRMED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.confirmed,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
          },
          history: [{}],
        },
        {
          id: 7,
<<<<<<< HEAD
          status: TRANSACTION_STATUSES.FAILED,
          metamaskNetworkId: currentNetworkId,
=======
          status: TransactionStatus.failed,
          chainId: currentChainId,
>>>>>>> upstream/multichain-swaps-controller
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

<<<<<<< HEAD
  describe('#_trackTransactionMetricsEvent', function () {
    let trackMetaMetricsEventSpy;

    beforeEach(function () {
      trackMetaMetricsEventSpy = sinon.spy(
        txController,
        '_trackMetaMetricsEvent',
      );
    });

    afterEach(function () {
      trackMetaMetricsEventSpy.restore();
    });

    it('should call _trackMetaMetricsEvent with the correct payload (user source)', function () {
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
        type: 'sentEther',
        origin: 'metamask',
        chainId: currentChainId,
        time: 1624408066355,
        metamaskNetworkId: currentNetworkId,
      };
      const expectedPayload = {
        event: 'Transaction Added',
        category: 'Transactions',
        properties: {
          chain_id: '0x2a',
          network: '42',
          referrer: 'metamask',
          source: 'user',
          type: 'sentEther',
        },
        sensitiveProperties: {
          gas_price: '2',
          gas_limit: '0x7b0d',
          first_seen: 1624408066355,
          transaction_envelope_type: 'legacy',
          status: 'unapproved',
        },
      };

      txController._trackTransactionMetricsEvent(
        txMeta,
        TRANSACTION_EVENTS.ADDED,
      );
      assert.equal(trackMetaMetricsEventSpy.callCount, 1);
      assert.deepEqual(
        trackMetaMetricsEventSpy.getCall(0).args[0],
        expectedPayload,
      );
    });

    it('should call _trackMetaMetricsEvent with the correct payload (dapp source)', function () {
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
        type: 'sentEther',
        origin: 'other',
        chainId: currentChainId,
        time: 1624408066355,
        metamaskNetworkId: currentNetworkId,
      };
      const expectedPayload = {
        event: 'Transaction Added',
        category: 'Transactions',
        properties: {
          chain_id: '0x2a',
          network: '42',
          referrer: 'other',
          source: 'dapp',
          type: 'sentEther',
        },
        sensitiveProperties: {
          gas_price: '2',
          gas_limit: '0x7b0d',
          first_seen: 1624408066355,
          transaction_envelope_type: 'legacy',
          status: 'unapproved',
        },
      };

      txController._trackTransactionMetricsEvent(
        txMeta,
        TRANSACTION_EVENTS.ADDED,
      );
      assert.equal(trackMetaMetricsEventSpy.callCount, 1);
      assert.deepEqual(
        trackMetaMetricsEventSpy.getCall(0).args[0],
        expectedPayload,
      );
    });

    it('should call _trackMetaMetricsEvent with the correct payload (extra params)', function () {
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
        type: 'sentEther',
        origin: 'other',
        chainId: currentChainId,
        time: 1624408066355,
        metamaskNetworkId: currentNetworkId,
      };
      const expectedPayload = {
        event: 'Transaction Added',
        category: 'Transactions',
        properties: {
          network: '42',
          referrer: 'other',
          source: 'dapp',
          type: 'sentEther',
          chain_id: '0x2a',
        },
        sensitiveProperties: {
          baz: 3.0,
          foo: 'bar',
          gas_price: '2',
          gas_limit: '0x7b0d',
          first_seen: 1624408066355,
          transaction_envelope_type: 'legacy',
          status: 'unapproved',
        },
      };

      txController._trackTransactionMetricsEvent(
        txMeta,
        TRANSACTION_EVENTS.ADDED,
        {
          baz: 3.0,
          foo: 'bar',
        },
      );
      assert.equal(trackMetaMetricsEventSpy.callCount, 1);
      assert.deepEqual(
        trackMetaMetricsEventSpy.getCall(0).args[0],
        expectedPayload,
      );
    });

    it('should call _trackMetaMetricsEvent with the correct payload (EIP-1559)', function () {
      const txMeta = {
        id: 1,
        status: TRANSACTION_STATUSES.UNAPPROVED,
        txParams: {
          from: fromAccount.address,
          to: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          maxFeePerGas: '0x77359400',
          maxPriorityFeePerGas: '0x77359400',
          gas: '0x7b0d',
          nonce: '0x4b',
        },
        type: 'sentEther',
        origin: 'other',
        chainId: currentChainId,
        time: 1624408066355,
        metamaskNetworkId: currentNetworkId,
      };
      const expectedPayload = {
        event: 'Transaction Added',
        category: 'Transactions',
        properties: {
          chain_id: '0x2a',
          network: '42',
          referrer: 'other',
          source: 'dapp',
          type: 'sentEther',
        },
        sensitiveProperties: {
          baz: 3.0,
          foo: 'bar',
          max_fee_per_gas: '2',
          max_priority_fee_per_gas: '2',
          gas_limit: '0x7b0d',
          first_seen: 1624408066355,
          transaction_envelope_type: 'fee-market',
          status: 'unapproved',
        },
      };

      txController._trackTransactionMetricsEvent(
        txMeta,
        TRANSACTION_EVENTS.ADDED,
        {
          baz: 3.0,
          foo: 'bar',
        },
      );
      assert.equal(trackMetaMetricsEventSpy.callCount, 1);
      assert.deepEqual(
        trackMetaMetricsEventSpy.getCall(0).args[0],
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

=======
>>>>>>> upstream/multichain-swaps-controller
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
<<<<<<< HEAD
=======

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
        chainId: currentChainId,
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
        chainId: currentChainId,
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
        chainId: currentChainId,
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
        chainId: currentChainId,
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
        chainId: currentChainId,
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
        chainId: currentChainId,
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
        chainId: currentChainId,
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
        chainId: currentChainId,
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
        chainId: currentChainId,
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
        chainId: currentChainId,
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

    it('ignores new transactions if hash matches existing incoming transaction', async function () {
      const existingTransaction = {
        ...TRANSACTION_META_MOCK,
        id: 1,
        type: TransactionType.incoming,
      };
      const existingTransaction2 = {
        ...TRANSACTION_META_MOCK,
        id: 2,
        hash: '0xNewHash',
        type: TransactionType.simpleSend,
      };

      const incomingTransaction1 = {
        ...TRANSACTION_META_MOCK,
        id: 3,
        type: TransactionType.incoming,
      };
      const incomingTransaction2 = {
        ...TRANSACTION_META_MOCK,
        id: 4,
        hash: '0xNewHash',
        type: TransactionType.incoming,
      };

      txController.store.getState().transactions = {
        [existingTransaction.id]: existingTransaction,
        [existingTransaction2.id]: existingTransaction2,
      };

      await incomingTransactionHelperEventMock.firstCall.args[1]({
        added: [incomingTransaction1, incomingTransaction2],
        updated: [],
      });

      assert.deepEqual(txController.store.getState().transactions, {
        [existingTransaction.id]: existingTransaction,
        [existingTransaction2.id]: existingTransaction2,
        [incomingTransaction2.id]: incomingTransaction2,
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
>>>>>>> upstream/multichain-swaps-controller
  });
});
