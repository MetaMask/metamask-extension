import { strict as assert } from 'assert';
import EventEmitter from 'events';
import { toBuffer } from 'ethereumjs-util';
import { TransactionFactory } from '@ethereumjs/tx';
import { ObservableStore } from '@metamask/obs-store';
import sinon from 'sinon';

import {
  createTestProviderTools,
  getTestAccounts,
} from '../../../../test/stub/provider';
import mockEstimates from '../../../../test/data/mock-estimates.json';
import { EVENT } from '../../../../shared/constants/metametrics';
import {
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
  TRANSACTION_ENVELOPE_TYPES,
  TRANSACTION_EVENTS,
  ASSET_TYPES,
} from '../../../../shared/constants/transaction';

import { SECOND } from '../../../../shared/constants/time';
import {
  GAS_ESTIMATE_TYPES,
  GAS_RECOMMENDATIONS,
} from '../../../../shared/constants/gas';
import { TRANSACTION_ENVELOPE_TYPE_NAMES } from '../../../../ui/helpers/constants/transactions';
import { METAMASK_CONTROLLER_EVENTS } from '../../metamask-controller';
import { TOKEN_STANDARDS } from '../../../../ui/helpers/constants/common';
import { ORIGIN_METAMASK } from '../../../../shared/constants/app';
import TransactionController from '.';

const noop = () => true;
const currentNetworkId = '42';
const currentChainId = '0x2a';
const providerConfig = {
  type: 'kovan',
};

const VALID_ADDRESS = '0x0000000000000000000000000000000000000000';
const VALID_ADDRESS_TWO = '0x0000000000000000000000000000000000000001';

describe('Transaction Controller', function () {
  let txController, provider, providerResultStub, fromAccount, fragmentExists;

  beforeEach(function () {
    fragmentExists = false;
    providerResultStub = {
      // 1 gwei
      eth_gasPrice: '0x0de0b6b3a7640000',
      // by default, all accounts are external accounts (not contracts)
      eth_getCode: '0x',
    };
    provider = createTestProviderTools({
      scaffold: providerResultStub,
      networkId: currentNetworkId,
      chainId: currentNetworkId,
    }).provider;

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
      trackMetaMetricsEvent: () => undefined,
      createEventFragment: () => undefined,
      updateEventFragment: () => undefined,
      finalizeEventFragment: () => undefined,
      getEventFragmentById: () =>
        fragmentExists === false ? undefined : { id: 0 },
      getEIP1559GasFeeEstimates: () => undefined,
      getAccountType: () => 'MetaMask',
      getDeviceModel: () => 'N/A',
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

    it('should not add maxFeePerGas and maxPriorityFeePerGas to type-0 transactions', async function () {
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
          status: TRANSACTION_STATUSES.UNAPPROVED,
          metamaskNetworkId: currentNetworkId,
          txParams: {
            to: VALID_ADDRESS,
            from: VALID_ADDRESS_TWO,
            type: TRANSACTION_ENVELOPE_TYPES.LEGACY,
          },
          history: [{}],
        },
      ]);
      const txMeta = {
        id: 1,
        txParams: {
          from: '0xc684832530fcbddae4b4230a47e991ddcec2831d',
          to: '0xc684832530fcbddae4b4230a47e991ddcec2831d',
          type: TRANSACTION_ENVELOPE_TYPES.LEGACY,
        },
        history: [{}],
      };
      providerResultStub.eth_getBlockByNumber = { gasLimit: '47b784' };
      providerResultStub.eth_estimateGas = '5209';

      const txMetaWithDefaults = await txController.addTxGasDefaults(txMeta);

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
        .stub(txController, 'getEIP1559Compatibility')
        .returns(true);

      const stub2 = sinon
        .stub(txController, '_getDefaultGasFees')
        .callsFake(() => ({ gasPrice: TEST_GASPRICE }));

      txController.txStateManager._addTransactionsToState([
        {
          id: 1,
          status: TRANSACTION_STATUSES.UNAPPROVED,
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
        type: TRANSACTION_TYPES.SIMPLE_SEND,
        transaction_envelope_type: TRANSACTION_ENVELOPE_TYPE_NAMES.LEGACY,
        origin: ORIGIN_METAMASK,
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
        estimateSuggested: GAS_RECOMMENDATIONS.MEDIUM,
        estimateUsed: GAS_RECOMMENDATIONS.HIGH,
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
      await txController.signTransaction('2');
      assert.equal(fromTxDataSpy.getCall(0).args[0].type, '0x2');
      eip1559CompatibilityStub.restore();
    });
  });

  describe('#publishTransaction', function () {
    let hash, txMeta, trackTransactionMetricsEventSpy;

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
          status: TRANSACTION_STATUSES.UNAPPROVED,
          txParams: {
            from: fromAccount.address,
            to: '0x1678a085c290ebd122dc42cba69373b5953b831d',
            gasPrice: '0x77359400',
            gas: '0x7b0d',
            nonce: '0x4b',
          },
          type: TRANSACTION_TYPES.SIMPLE_SEND,
          origin: ORIGIN_METAMASK,
          chainId: currentChainId,
          time: 1624408066355,
          metamaskNetworkId: currentNetworkId,
          defaultGasEstimates: {
            gas: '0x7b0d',
            gasPrice: '0x77359400',
          },
        };
      });

      it('should create an event fragment when transaction added', async function () {
        const expectedPayload = {
          initialEvent: 'Transaction Added',
          successEvent: 'Transaction Approved',
          failureEvent: 'Transaction Rejected',
          uniqueIdentifier: 'transaction-added-1',
          category: EVENT.CATEGORIES.TRANSACTIONS,
          persist: true,
          properties: {
            chain_id: '0x2a',
            eip_1559_version: '0',
            gas_edit_attempted: 'none',
            gas_edit_type: 'none',
            network: '42',
            referrer: ORIGIN_METAMASK,
            source: EVENT.SOURCE.TRANSACTION.USER,
            type: TRANSACTION_TYPES.SIMPLE_SEND,
            account_type: 'MetaMask',
            asset_type: ASSET_TYPES.NATIVE,
            token_standard: TOKEN_STANDARDS.NONE,
            device_model: 'N/A',
          },
          sensitiveProperties: {
            default_gas: '0.000031501',
            default_gas_price: '2',
            gas_price: '2',
            gas_limit: '0x7b0d',
            first_seen: 1624408066355,
            transaction_envelope_type: TRANSACTION_ENVELOPE_TYPE_NAMES.LEGACY,
            status: 'unapproved',
          },
        };

        await txController._trackTransactionMetricsEvent(
          txMeta,
          TRANSACTION_EVENTS.ADDED,
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
          TRANSACTION_EVENTS.REJECTED,
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
          TRANSACTION_EVENTS.APPROVED,
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
          initialEvent: 'Transaction Submitted',
          successEvent: 'Transaction Finalized',
          uniqueIdentifier: 'transaction-submitted-1',
          category: EVENT.CATEGORIES.TRANSACTIONS,
          persist: true,
          properties: {
            chain_id: '0x2a',
            eip_1559_version: '0',
            gas_edit_attempted: 'none',
            gas_edit_type: 'none',
            network: '42',
            referrer: ORIGIN_METAMASK,
            source: EVENT.SOURCE.TRANSACTION.USER,
            type: TRANSACTION_TYPES.SIMPLE_SEND,
            account_type: 'MetaMask',
            asset_type: ASSET_TYPES.NATIVE,
            token_standard: TOKEN_STANDARDS.NONE,
            device_model: 'N/A',
          },
          sensitiveProperties: {
            default_gas: '0.000031501',
            default_gas_price: '2',
            gas_price: '2',
            gas_limit: '0x7b0d',
            first_seen: 1624408066355,
            transaction_envelope_type: TRANSACTION_ENVELOPE_TYPE_NAMES.LEGACY,
            status: 'unapproved',
          },
        };

        await txController._trackTransactionMetricsEvent(
          txMeta,
          TRANSACTION_EVENTS.SUBMITTED,
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
          TRANSACTION_EVENTS.FINALIZED,
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
          status: TRANSACTION_STATUSES.UNAPPROVED,
          txParams: {
            from: fromAccount.address,
            to: '0x1678a085c290ebd122dc42cba69373b5953b831d',
            gasPrice: '0x77359400',
            gas: '0x7b0d',
            nonce: '0x4b',
          },
          type: TRANSACTION_TYPES.SIMPLE_SEND,
          origin: 'other',
          chainId: currentChainId,
          time: 1624408066355,
          metamaskNetworkId: currentNetworkId,
          defaultGasEstimates: {
            gas: '0x7b0d',
            gasPrice: '0x77359400',
          },
        };
      });

      it('should create an event fragment when transaction added', async function () {
        const expectedPayload = {
          initialEvent: 'Transaction Added',
          successEvent: 'Transaction Approved',
          failureEvent: 'Transaction Rejected',
          uniqueIdentifier: 'transaction-added-1',
          category: EVENT.CATEGORIES.TRANSACTIONS,
          persist: true,
          properties: {
            chain_id: '0x2a',
            eip_1559_version: '0',
            gas_edit_attempted: 'none',
            gas_edit_type: 'none',
            network: '42',
            referrer: 'other',
            source: EVENT.SOURCE.TRANSACTION.DAPP,
            type: TRANSACTION_TYPES.SIMPLE_SEND,
            account_type: 'MetaMask',
            asset_type: ASSET_TYPES.NATIVE,
            token_standard: TOKEN_STANDARDS.NONE,
            device_model: 'N/A',
          },
          sensitiveProperties: {
            default_gas: '0.000031501',
            default_gas_price: '2',
            gas_price: '2',
            gas_limit: '0x7b0d',
            first_seen: 1624408066355,
            transaction_envelope_type: TRANSACTION_ENVELOPE_TYPE_NAMES.LEGACY,
            status: 'unapproved',
          },
        };

        await txController._trackTransactionMetricsEvent(
          txMeta,
          TRANSACTION_EVENTS.ADDED,
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
          TRANSACTION_EVENTS.REJECTED,
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
          TRANSACTION_EVENTS.APPROVED,
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
          initialEvent: 'Transaction Submitted',
          successEvent: 'Transaction Finalized',
          uniqueIdentifier: 'transaction-submitted-1',
          category: EVENT.CATEGORIES.TRANSACTIONS,
          persist: true,
          properties: {
            chain_id: '0x2a',
            eip_1559_version: '0',
            gas_edit_attempted: 'none',
            gas_edit_type: 'none',
            network: '42',
            referrer: 'other',
            source: EVENT.SOURCE.TRANSACTION.DAPP,
            type: TRANSACTION_TYPES.SIMPLE_SEND,
            account_type: 'MetaMask',
            asset_type: ASSET_TYPES.NATIVE,
            token_standard: TOKEN_STANDARDS.NONE,
            device_model: 'N/A',
          },
          sensitiveProperties: {
            default_gas: '0.000031501',
            default_gas_price: '2',
            gas_price: '2',
            gas_limit: '0x7b0d',
            first_seen: 1624408066355,
            transaction_envelope_type: TRANSACTION_ENVELOPE_TYPE_NAMES.LEGACY,
            status: 'unapproved',
          },
        };

        await txController._trackTransactionMetricsEvent(
          txMeta,
          TRANSACTION_EVENTS.SUBMITTED,
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
          TRANSACTION_EVENTS.FINALIZED,
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
        status: TRANSACTION_STATUSES.UNAPPROVED,
        txParams: {
          from: fromAccount.address,
          to: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          gasPrice: '0x77359400',
          gas: '0x7b0d',
          nonce: '0x4b',
        },
        type: TRANSACTION_TYPES.SIMPLE_SEND,
        origin: 'other',
        chainId: currentChainId,
        time: 1624408066355,
        metamaskNetworkId: currentNetworkId,
      };

      const expectedPayload = {
        successEvent: 'Transaction Approved',
        failureEvent: 'Transaction Rejected',
        uniqueIdentifier: 'transaction-added-1',
        category: EVENT.CATEGORIES.TRANSACTIONS,
        persist: true,
        properties: {
          chain_id: '0x2a',
          eip_1559_version: '0',
          gas_edit_attempted: 'none',
          gas_edit_type: 'none',
          network: '42',
          referrer: 'other',
          source: EVENT.SOURCE.TRANSACTION.DAPP,
          type: TRANSACTION_TYPES.SIMPLE_SEND,
          account_type: 'MetaMask',
          asset_type: ASSET_TYPES.NATIVE,
          token_standard: TOKEN_STANDARDS.NONE,
          device_model: 'N/A',
        },
        sensitiveProperties: {
          gas_price: '2',
          gas_limit: '0x7b0d',
          first_seen: 1624408066355,
          transaction_envelope_type: TRANSACTION_ENVELOPE_TYPE_NAMES.LEGACY,
          status: 'unapproved',
        },
      };
      await txController._trackTransactionMetricsEvent(
        txMeta,
        TRANSACTION_EVENTS.APPROVED,
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
        status: TRANSACTION_STATUSES.UNAPPROVED,
        txParams: {
          from: fromAccount.address,
          to: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          gasPrice: '0x77359400',
          gas: '0x7b0d',
          nonce: '0x4b',
        },
        type: TRANSACTION_TYPES.SIMPLE_SEND,
        origin: 'other',
        chainId: currentChainId,
        time: 1624408066355,
        metamaskNetworkId: currentNetworkId,
      };
      const expectedPayload = {
        initialEvent: 'Transaction Added',
        successEvent: 'Transaction Approved',
        failureEvent: 'Transaction Rejected',
        uniqueIdentifier: 'transaction-added-1',
        persist: true,
        category: EVENT.CATEGORIES.TRANSACTIONS,
        properties: {
          network: '42',
          referrer: 'other',
          source: EVENT.SOURCE.TRANSACTION.DAPP,
          type: TRANSACTION_TYPES.SIMPLE_SEND,
          chain_id: '0x2a',
          eip_1559_version: '0',
          gas_edit_attempted: 'none',
          gas_edit_type: 'none',
          account_type: 'MetaMask',
          asset_type: ASSET_TYPES.NATIVE,
          token_standard: TOKEN_STANDARDS.NONE,
          device_model: 'N/A',
        },
        sensitiveProperties: {
          baz: 3.0,
          foo: 'bar',
          gas_price: '2',
          gas_limit: '0x7b0d',
          first_seen: 1624408066355,
          transaction_envelope_type: TRANSACTION_ENVELOPE_TYPE_NAMES.LEGACY,
          status: 'unapproved',
        },
      };

      await txController._trackTransactionMetricsEvent(
        txMeta,
        TRANSACTION_EVENTS.ADDED,
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
        status: TRANSACTION_STATUSES.UNAPPROVED,
        txParams: {
          from: fromAccount.address,
          to: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          maxFeePerGas: '0x77359400',
          maxPriorityFeePerGas: '0x77359400',
          gas: '0x7b0d',
          nonce: '0x4b',
          estimateSuggested: GAS_RECOMMENDATIONS.MEDIUM,
          estimateUsed: GAS_RECOMMENDATIONS.HIGH,
        },
        type: TRANSACTION_TYPES.SIMPLE_SEND,
        origin: 'other',
        chainId: currentChainId,
        time: 1624408066355,
        metamaskNetworkId: currentNetworkId,
        defaultGasEstimates: {
          estimateType: 'medium',
          maxFeePerGas: '0x77359400',
          maxPriorityFeePerGas: '0x77359400',
        },
      };
      const expectedPayload = {
        initialEvent: 'Transaction Added',
        successEvent: 'Transaction Approved',
        failureEvent: 'Transaction Rejected',
        uniqueIdentifier: 'transaction-added-1',
        persist: true,
        category: EVENT.CATEGORIES.TRANSACTIONS,
        properties: {
          chain_id: '0x2a',
          eip_1559_version: '1',
          gas_edit_attempted: 'none',
          gas_edit_type: 'none',
          network: '42',
          referrer: 'other',
          source: EVENT.SOURCE.TRANSACTION.DAPP,
          type: TRANSACTION_TYPES.SIMPLE_SEND,
          account_type: 'MetaMask',
          asset_type: ASSET_TYPES.NATIVE,
          token_standard: TOKEN_STANDARDS.NONE,
          device_model: 'N/A',
        },
        sensitiveProperties: {
          baz: 3.0,
          foo: 'bar',
          max_fee_per_gas: '2',
          max_priority_fee_per_gas: '2',
          gas_limit: '0x7b0d',
          first_seen: 1624408066355,
          transaction_envelope_type: TRANSACTION_ENVELOPE_TYPE_NAMES.FEE_MARKET,
          status: 'unapproved',
          estimate_suggested: GAS_RECOMMENDATIONS.MEDIUM,
          estimate_used: GAS_RECOMMENDATIONS.HIGH,
          default_estimate: 'medium',
          default_max_fee_per_gas: '70',
          default_max_priority_fee_per_gas: '7',
        },
      };

      await txController._trackTransactionMetricsEvent(
        txMeta,
        TRANSACTION_EVENTS.ADDED,
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
        estimate_suggested: GAS_RECOMMENDATIONS.MEDIUM,
        estimate_used: GAS_RECOMMENDATIONS.HIGH,
      };
      const expectedParams = {
        max_fee_per_gas: '2',
        max_priority_fee_per_gas: '2',
        estimate_suggested: GAS_RECOMMENDATIONS.MEDIUM,
        estimate_used: GAS_RECOMMENDATIONS.HIGH,
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
        status: TRANSACTION_STATUSES.UNAPPROVED,
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
        status: TRANSACTION_STATUSES.UNAPPROVED,
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
        status: TRANSACTION_STATUSES.UNAPPROVED,
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

    it('updates estimated base fee', function () {
      txController.updateTransactionEstimatedBaseFee('1', {
        estimatedBaseFee: '0x0066',
        decEstimatedBaseFee: '66',
      });
      const result = txStateManager.getTransaction('1');
      assert.equal(result.estimatedBaseFee, '0x0066');
      assert.equal(result.decEstimatedBaseFee, '66');
    });

    it('updates swap approval transaction', function () {
      txController.updateSwapApprovalTransaction('1', {
        type: 'swapApproval',
        sourceTokenSymbol: 'XBN',
      });

      const result = txStateManager.getTransaction('1');
      assert.equal(result.type, 'swapApproval');
      assert.equal(result.sourceTokenSymbol, 'XBN');
    });

    it('updates swap transaction', function () {
      txController.updateSwapTransaction('1', {
        sourceTokenSymbol: 'BTCX',
        destinationTokenSymbol: 'ETH',
      });

      const result = txStateManager.getTransaction('1');
      assert.equal(result.sourceTokenSymbol, 'BTCX');
      assert.equal(result.destinationTokenSymbol, 'ETH');
      assert.equal(result.destinationTokenDecimals, 16);
      assert.equal(result.destinationTokenAddress, VALID_ADDRESS);
      assert.equal(result.swapTokenValue, '0x007');

      txController.updateSwapTransaction('1', {
        type: 'swapped',
        destinationTokenDecimals: 8,
        destinationTokenAddress: VALID_ADDRESS_TWO,
        swapTokenValue: '0x0077',
      });
      assert.equal(result.sourceTokenSymbol, 'BTCX');
      assert.equal(result.destinationTokenSymbol, 'ETH');
      assert.equal(result.type, 'swapped');
      assert.equal(result.destinationTokenDecimals, 8);
      assert.equal(result.destinationTokenAddress, VALID_ADDRESS_TWO);
      assert.equal(result.swapTokenValue, '0x0077');
    });

    it('updates transaction user settings', function () {
      txController.updateTransactionUserSettings('1', {
        userEditedGasLimit: '0x0088',
        userFeeLevel: 'high',
      });

      const result = txStateManager.getTransaction('1');
      assert.equal(result.userEditedGasLimit, '0x0088');
      assert.equal(result.userFeeLevel, 'high');
    });

    it('should not update and should throw error if status is not type "unapproved"', function () {
      txStateManager.addTransaction({
        id: '4',
        status: TRANSACTION_STATUSES.DROPPED,
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
         Current tx status: ${TRANSACTION_STATUSES.DROPPED}`,
      );

      const transaction = txStateManager.getTransaction('4');
      assert.equal(transaction.txParams.maxFeePerGas, '0x008');
    });

    it('does not update unknown parameters in update method', function () {
      txController.updateSwapTransaction('1', {
        type: 'swapped',
        destinationTokenDecimals: 8,
        destinationTokenAddress: VALID_ADDRESS_TWO,
        swapTokenValue: '0x011',
        gasPrice: '0x12',
      });

      let result = txStateManager.getTransaction('1');

      assert.equal(result.type, 'swapped');
      assert.equal(result.destinationTokenDecimals, 8);
      assert.equal(result.destinationTokenAddress, VALID_ADDRESS_TWO);
      assert.equal(result.swapTokenValue, '0x011');
      assert.equal(result.txParams.gasPrice, '0x002'); // not updated even though it's passed in to update

      txController.updateTransactionGasFees('1', {
        estimateUsed: '0x13',
        gasPrice: '0x14',
        destinationTokenAddress: VALID_ADDRESS,
      });

      result = txStateManager.getTransaction('1');
      assert.equal(result.estimateUsed, '0x13');
      assert.equal(result.txParams.gasPrice, '0x14');
      assert.equal(result.destinationTokenAddress, VALID_ADDRESS_TWO); // not updated even though it's passed in to update
    });
  });

  describe('updateEditableParams', function () {
    let txStateManager;

    beforeEach(function () {
      txStateManager = txController.txStateManager;
      txStateManager.addTransaction({
        id: '1',
        status: TRANSACTION_STATUSES.UNAPPROVED,
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
        data:
          '0xa9059cbb000000000000000000000000e18035bf8712672935fdb4e5e431b1a0183d2dfc0000000000000000000000000000000000000000000000000de0b6b3a7640000',
      });
      const result = txStateManager.getTransaction('1');
      assert.equal(
        result.txParams.data,
        '0xa9059cbb000000000000000000000000e18035bf8712672935fdb4e5e431b1a0183d2dfc0000000000000000000000000000000000000000000000000de0b6b3a7640000',
      );
      assert.equal(result.type, TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER);
    });

    it('updates editible params when type changes from token transfer to simple send', async function () {
      // test update gasFees
      txStateManager.addTransaction({
        id: '2',
        status: TRANSACTION_STATUSES.UNAPPROVED,
        metamaskNetworkId: currentNetworkId,
        txParams: {
          gas: '0x001',
          gasPrice: '0x002',
          // max fees can not be mixed with gasPrice
          // maxPriorityFeePerGas: '0x003',
          // maxFeePerGas: '0x004',
          to: VALID_ADDRESS,
          from: VALID_ADDRESS,
          data:
            '0xa9059cbb000000000000000000000000e18035bf8712672935fdb4e5e431b1a0183d2dfc0000000000000000000000000000000000000000000000000de0b6b3a7640000',
        },
        estimateUsed: '0x005',
        estimatedBaseFee: '0x006',
        decEstimatedBaseFee: '6',
        type: TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER,
        userEditedGasLimit: '0x008',
        userFeeLevel: 'medium',
      });
      await txController.updateEditableParams('2', {
        data: '0x',
      });
      const result = txStateManager.getTransaction('2');
      assert.equal(result.txParams.data, '0x');
      assert.equal(result.type, TRANSACTION_TYPES.SIMPLE_SEND);
    });

    it('updates editible params when type changes from simpleSend to contract interaction', async function () {
      // test update gasFees
      txStateManager.addTransaction({
        id: '3',
        status: TRANSACTION_STATUSES.UNAPPROVED,
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
        type: TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER,
        userEditedGasLimit: '0x008',
        userFeeLevel: 'medium',
      });
      providerResultStub.eth_getCode = '0x5';
      await txController.updateEditableParams('3', {
        data: '0x123',
      });
      const result = txStateManager.getTransaction('3');
      assert.equal(result.txParams.data, '0x123');
      assert.equal(result.type, TRANSACTION_TYPES.CONTRACT_INTERACTION);
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
      assert.equal(result.type, TRANSACTION_TYPES.SIMPLE_SEND);
    });
  });
});
