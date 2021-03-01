import assert from 'assert';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import sinon from 'sinon';
import {
  ROPSTEN_CHAIN_ID,
  ROPSTEN_NETWORK_ID,
} from '../../../../shared/constants/network';
import { TRANSACTION_STATUSES } from '../../../../shared/constants/transaction';

import ConfirmTransactionReducer, * as actions from './confirm-transaction.duck';

const initialState = {
  txData: {},
  tokenData: {},
  fiatTransactionAmount: '',
  fiatTransactionFee: '',
  fiatTransactionTotal: '',
  ethTransactionAmount: '',
  ethTransactionFee: '',
  ethTransactionTotal: '',
  hexTransactionAmount: '',
  hexTransactionFee: '',
  hexTransactionTotal: '',
  nonce: '',
};

const UPDATE_TX_DATA = 'metamask/confirm-transaction/UPDATE_TX_DATA';
const UPDATE_TOKEN_DATA = 'metamask/confirm-transaction/UPDATE_TOKEN_DATA';
const UPDATE_TRANSACTION_AMOUNTS =
  'metamask/confirm-transaction/UPDATE_TRANSACTION_AMOUNTS';
const UPDATE_TRANSACTION_FEES =
  'metamask/confirm-transaction/UPDATE_TRANSACTION_FEES';
const UPDATE_TRANSACTION_TOTALS =
  'metamask/confirm-transaction/UPDATE_TRANSACTION_TOTALS';
const UPDATE_NONCE = 'metamask/confirm-transaction/UPDATE_NONCE';
const CLEAR_CONFIRM_TRANSACTION =
  'metamask/confirm-transaction/CLEAR_CONFIRM_TRANSACTION';

describe('Confirm Transaction Duck', function () {
  describe('State changes', function () {
    const mockState = {
      txData: {
        id: 1,
      },
      tokenData: {
        name: 'abcToken',
      },
      fiatTransactionAmount: '469.26',
      fiatTransactionFee: '0.01',
      fiatTransactionTotal: '1.000021',
      ethTransactionAmount: '1',
      ethTransactionFee: '0.000021',
      ethTransactionTotal: '469.27',
      hexTransactionAmount: '',
      hexTransactionFee: '0x1319718a5000',
      hexTransactionTotal: '',
      nonce: '0x0',
    };

    it('should initialize state', function () {
      assert.deepStrictEqual(
        ConfirmTransactionReducer(undefined, {}),
        initialState,
      );
    });

    it('should return state unchanged if it does not match a dispatched actions type', function () {
      assert.deepStrictEqual(
        ConfirmTransactionReducer(mockState, {
          type: 'someOtherAction',
          value: 'someValue',
        }),
        { ...mockState },
      );
    });

    it('should set txData when receiving a UPDATE_TX_DATA action', function () {
      assert.deepStrictEqual(
        ConfirmTransactionReducer(mockState, {
          type: UPDATE_TX_DATA,
          payload: {
            id: 2,
          },
        }),
        {
          ...mockState,
          txData: {
            ...mockState.txData,
            id: 2,
          },
        },
      );
    });

    it('should set tokenData when receiving a UPDATE_TOKEN_DATA action', function () {
      assert.deepStrictEqual(
        ConfirmTransactionReducer(mockState, {
          type: UPDATE_TOKEN_DATA,
          payload: {
            name: 'defToken',
          },
        }),
        {
          ...mockState,
          tokenData: {
            ...mockState.tokenData,
            name: 'defToken',
          },
        },
      );
    });

    it('should update transaction amounts when receiving an UPDATE_TRANSACTION_AMOUNTS action', function () {
      assert.deepStrictEqual(
        ConfirmTransactionReducer(mockState, {
          type: UPDATE_TRANSACTION_AMOUNTS,
          payload: {
            fiatTransactionAmount: '123.45',
            ethTransactionAmount: '.5',
            hexTransactionAmount: '0x1',
          },
        }),
        {
          ...mockState,
          fiatTransactionAmount: '123.45',
          ethTransactionAmount: '.5',
          hexTransactionAmount: '0x1',
        },
      );
    });

    it('should update transaction fees when receiving an UPDATE_TRANSACTION_FEES action', function () {
      assert.deepStrictEqual(
        ConfirmTransactionReducer(mockState, {
          type: UPDATE_TRANSACTION_FEES,
          payload: {
            fiatTransactionFee: '123.45',
            ethTransactionFee: '.5',
            hexTransactionFee: '0x1',
          },
        }),
        {
          ...mockState,
          fiatTransactionFee: '123.45',
          ethTransactionFee: '.5',
          hexTransactionFee: '0x1',
        },
      );
    });

    it('should update transaction totals when receiving an UPDATE_TRANSACTION_TOTALS action', function () {
      assert.deepStrictEqual(
        ConfirmTransactionReducer(mockState, {
          type: UPDATE_TRANSACTION_TOTALS,
          payload: {
            fiatTransactionTotal: '123.45',
            ethTransactionTotal: '.5',
            hexTransactionTotal: '0x1',
          },
        }),
        {
          ...mockState,
          fiatTransactionTotal: '123.45',
          ethTransactionTotal: '.5',
          hexTransactionTotal: '0x1',
        },
      );
    });

    it('should update nonce when receiving an UPDATE_NONCE action', function () {
      assert.deepStrictEqual(
        ConfirmTransactionReducer(mockState, {
          type: UPDATE_NONCE,
          payload: '0x1',
        }),
        {
          ...mockState,
          nonce: '0x1',
        },
      );
    });

    it('should clear confirmTransaction when receiving a FETCH_DATA_END action', function () {
      assert.deepStrictEqual(
        ConfirmTransactionReducer(mockState, {
          type: CLEAR_CONFIRM_TRANSACTION,
        }),
        initialState,
      );
    });
  });

  describe('Single actions', function () {
    it('should create an action to update txData', function () {
      const txData = { test: 123 };
      const expectedAction = {
        type: UPDATE_TX_DATA,
        payload: txData,
      };

      assert.deepStrictEqual(actions.updateTxData(txData), expectedAction);
    });

    it('should create an action to update tokenData', function () {
      const tokenData = { test: 123 };
      const expectedAction = {
        type: UPDATE_TOKEN_DATA,
        payload: tokenData,
      };

      assert.deepStrictEqual(
        actions.updateTokenData(tokenData),
        expectedAction,
      );
    });

    it('should create an action to update transaction amounts', function () {
      const transactionAmounts = { test: 123 };
      const expectedAction = {
        type: UPDATE_TRANSACTION_AMOUNTS,
        payload: transactionAmounts,
      };

      assert.deepStrictEqual(
        actions.updateTransactionAmounts(transactionAmounts),
        expectedAction,
      );
    });

    it('should create an action to update transaction fees', function () {
      const transactionFees = { test: 123 };
      const expectedAction = {
        type: UPDATE_TRANSACTION_FEES,
        payload: transactionFees,
      };

      assert.deepStrictEqual(
        actions.updateTransactionFees(transactionFees),
        expectedAction,
      );
    });

    it('should create an action to update transaction totals', function () {
      const transactionTotals = { test: 123 };
      const expectedAction = {
        type: UPDATE_TRANSACTION_TOTALS,
        payload: transactionTotals,
      };

      assert.deepStrictEqual(
        actions.updateTransactionTotals(transactionTotals),
        expectedAction,
      );
    });

    it('should create an action to update nonce', function () {
      const nonce = '0x1';
      const expectedAction = {
        type: UPDATE_NONCE,
        payload: nonce,
      };

      assert.deepStrictEqual(actions.updateNonce(nonce), expectedAction);
    });

    it('should create an action to clear confirmTransaction', function () {
      const expectedAction = {
        type: CLEAR_CONFIRM_TRANSACTION,
      };

      assert.deepStrictEqual(actions.clearConfirmTransaction(), expectedAction);
    });
  });

  describe('Thunk actions', function () {
    beforeEach(function () {
      global.eth = {
        getCode: sinon
          .stub()
          .callsFake((address) =>
            Promise.resolve(address?.match(/isContract/u) ? 'not-0x' : '0x'),
          ),
      };
    });

    afterEach(function () {
      global.eth.getCode.resetHistory();
    });

    it('updates txData and updates gas values in confirmTransaction', function () {
      const txData = {
        history: [],
        id: 2603411941761054,
        loadingDefaults: false,
        metamaskNetworkId: ROPSTEN_NETWORK_ID,
        origin: 'faucet.metamask.io',
        status: TRANSACTION_STATUSES.UNAPPROVED,
        time: 1530838113716,
        txParams: {
          from: '0xc5ae6383e126f901dcb06131d97a88745bfa88d6',
          gas: '0x33450',
          gasPrice: '0x2540be400',
          to: '0x81b7e08f65bdf5648606c89998a9cc8164397647',
          value: '0xde0b6b3a7640000',
        },
      };
      const mockState = {
        metamask: {
          conversionRate: 468.58,
          currentCurrency: 'usd',
        },
        confirmTransaction: {
          ethTransactionAmount: '1',
          ethTransactionFee: '0.000021',
          ethTransactionTotal: '1.000021',
          fetchingData: false,
          fiatTransactionAmount: '469.26',
          fiatTransactionFee: '0.01',
          fiatTransactionTotal: '469.27',
          hexGasTotal: '0x1319718a5000',
          methodData: {},
          nonce: '',
          tokenData: {},
          tokenProps: {
            tokenDecimals: '',
            tokenSymbol: '',
          },
          txData: {
            ...txData,
            txParams: {
              ...txData.txParams,
            },
          },
        },
      };

      const middlewares = [thunk];
      const mockStore = configureMockStore(middlewares);
      const store = mockStore(mockState);
      const expectedActions = [
        'metamask/confirm-transaction/UPDATE_TX_DATA',
        'metamask/confirm-transaction/UPDATE_TRANSACTION_AMOUNTS',
        'metamask/confirm-transaction/UPDATE_TRANSACTION_FEES',
        'metamask/confirm-transaction/UPDATE_TRANSACTION_TOTALS',
      ];

      store.dispatch(actions.updateTxDataAndCalculate(txData));

      const storeActions = store.getActions();
      assert.strictEqual(storeActions.length, expectedActions.length);
      storeActions.forEach((action, index) =>
        assert.strictEqual(action.type, expectedActions[index]),
      );
    });

    it('updates confirmTransaction transaction', function () {
      const mockState = {
        metamask: {
          conversionRate: 468.58,
          currentCurrency: 'usd',
          network: ROPSTEN_NETWORK_ID,
          provider: {
            chainId: ROPSTEN_CHAIN_ID,
          },
          unapprovedTxs: {
            2603411941761054: {
              history: [],
              id: 2603411941761054,
              loadingDefaults: false,
              metamaskNetworkId: ROPSTEN_NETWORK_ID,
              origin: 'faucet.metamask.io',
              status: TRANSACTION_STATUSES.UNAPPROVED,
              time: 1530838113716,
              txParams: {
                from: '0xc5ae6383e126f901dcb06131d97a88745bfa88d6',
                gas: '0x33450',
                gasPrice: '0x2540be400',
                to: '0x81b7e08f65bdf5648606c89998a9cc8164397647',
                value: '0xde0b6b3a7640000',
              },
            },
          },
        },
        confirmTransaction: {},
      };

      const middlewares = [thunk];
      const mockStore = configureMockStore(middlewares);
      const store = mockStore(mockState);
      const expectedActions = [
        'metamask/confirm-transaction/UPDATE_TX_DATA',
        'metamask/confirm-transaction/UPDATE_TRANSACTION_AMOUNTS',
        'metamask/confirm-transaction/UPDATE_TRANSACTION_FEES',
        'metamask/confirm-transaction/UPDATE_TRANSACTION_TOTALS',
      ];

      store.dispatch(actions.setTransactionToConfirm(2603411941761054));
      const storeActions = store.getActions();
      assert.strictEqual(storeActions.length, expectedActions.length);

      storeActions.forEach((action, index) =>
        assert.strictEqual(action.type, expectedActions[index]),
      );
    });
  });
});
