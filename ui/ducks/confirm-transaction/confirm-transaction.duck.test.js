import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import sinon from 'sinon';
import { TransactionStatus } from '@metamask/transaction-controller';

import { CHAIN_IDS } from '../../../shared/constants/network';
import { mockNetworkState } from '../../../test/stub/networks';
import ConfirmTransactionReducer, * as actions from './confirm-transaction.duck';

const initialState = {
  txData: {},
  tokenData: {},
  tokenProps: {},
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
  maxValueMode: {},
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
const SET_MAX_VALUE_MODE = 'metamask/confirm-transaction/SET_MAX_VALUE_MODE';

describe('Confirm Transaction Duck', () => {
  describe('State changes', () => {
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
      maxValueMode: {
        '123abc': true,
      },
    };

    it('should initialize state', () => {
      expect(ConfirmTransactionReducer(undefined, {})).toStrictEqual(
        initialState,
      );
    });

    it('should return state unchanged if it does not match a dispatched actions type', () => {
      expect(
        ConfirmTransactionReducer(mockState, {
          type: 'someOtherAction',
          value: 'someValue',
        }),
      ).toStrictEqual({ ...mockState });
    });

    it('should set txData when receiving a UPDATE_TX_DATA action', () => {
      expect(
        ConfirmTransactionReducer(mockState, {
          type: UPDATE_TX_DATA,
          payload: {
            id: 2,
          },
        }),
      ).toStrictEqual({
        ...mockState,
        txData: {
          ...mockState.txData,
          id: 2,
        },
      });
    });

    it('should set tokenData when receiving a UPDATE_TOKEN_DATA action', () => {
      expect(
        ConfirmTransactionReducer(mockState, {
          type: UPDATE_TOKEN_DATA,
          payload: {
            name: 'defToken',
          },
        }),
      ).toStrictEqual({
        ...mockState,
        tokenData: {
          ...mockState.tokenData,
          name: 'defToken',
        },
      });
    });

    it('should update transaction amounts when receiving an UPDATE_TRANSACTION_AMOUNTS action', () => {
      expect(
        ConfirmTransactionReducer(mockState, {
          type: UPDATE_TRANSACTION_AMOUNTS,
          payload: {
            fiatTransactionAmount: '123.45',
            ethTransactionAmount: '.5',
            hexTransactionAmount: '0x1',
          },
        }),
      ).toStrictEqual({
        ...mockState,
        fiatTransactionAmount: '123.45',
        ethTransactionAmount: '.5',
        hexTransactionAmount: '0x1',
      });
    });

    it('should update transaction fees when receiving an UPDATE_TRANSACTION_FEES action', () => {
      expect(
        ConfirmTransactionReducer(mockState, {
          type: UPDATE_TRANSACTION_FEES,
          payload: {
            fiatTransactionFee: '123.45',
            ethTransactionFee: '.5',
            hexTransactionFee: '0x1',
          },
        }),
      ).toStrictEqual({
        ...mockState,
        fiatTransactionFee: '123.45',
        ethTransactionFee: '.5',
        hexTransactionFee: '0x1',
      });
    });

    it('should update transaction totals when receiving an UPDATE_TRANSACTION_TOTALS action', () => {
      expect(
        ConfirmTransactionReducer(mockState, {
          type: UPDATE_TRANSACTION_TOTALS,
          payload: {
            fiatTransactionTotal: '123.45',
            ethTransactionTotal: '.5',
            hexTransactionTotal: '0x1',
          },
        }),
      ).toStrictEqual({
        ...mockState,
        fiatTransactionTotal: '123.45',
        ethTransactionTotal: '.5',
        hexTransactionTotal: '0x1',
      });
    });

    it('should update nonce when receiving an UPDATE_NONCE action', () => {
      expect(
        ConfirmTransactionReducer(mockState, {
          type: UPDATE_NONCE,
          payload: '0x1',
        }),
      ).toStrictEqual({
        ...mockState,
        nonce: '0x1',
      });
    });

    it("shouldn't clear maxValueMode when receiving a CLEAR_CONFIRM_TRANSACTION action", () => {
      expect(
        ConfirmTransactionReducer(mockState, {
          type: CLEAR_CONFIRM_TRANSACTION,
        }),
      ).toStrictEqual({
        ...initialState,
        maxValueMode: mockState.maxValueMode,
      });
    });

    it('should set max value mode', () => {
      const mockId = '123abc';
      expect(
        ConfirmTransactionReducer(mockState, {
          type: SET_MAX_VALUE_MODE,
          payload: {
            transactionId: mockId,
            enabled: false,
          },
        }).maxValueMode[mockId],
      ).toBe(false);
    });

    it('should clear confirmTransaction when receiving a FETCH_DATA_END action', () => {
      expect(
        ConfirmTransactionReducer(mockState, {
          type: CLEAR_CONFIRM_TRANSACTION,
        }),
      ).toStrictEqual({
        ...initialState,
        maxValueMode: mockState.maxValueMode,
      });
    });
  });

  describe('Single actions', function () {
    it('should create an action to update txData', function () {
      const txData = { test: 123 };
      const expectedAction = {
        type: UPDATE_TX_DATA,
        payload: txData,
      };

      expect(actions.updateTxData(txData)).toStrictEqual(expectedAction);
    });

    it('should create an action to update tokenData', function () {
      const tokenData = { test: 123 };
      const expectedAction = {
        type: UPDATE_TOKEN_DATA,
        payload: tokenData,
      };

      expect(actions.updateTokenData(tokenData)).toStrictEqual(expectedAction);
    });

    it('should create an action to update transaction amounts', function () {
      const transactionAmounts = { test: 123 };
      const expectedAction = {
        type: UPDATE_TRANSACTION_AMOUNTS,
        payload: transactionAmounts,
      };

      expect(
        actions.updateTransactionAmounts(transactionAmounts),
      ).toStrictEqual(expectedAction);
    });

    it('should create an action to update transaction fees', function () {
      const transactionFees = { test: 123 };
      const expectedAction = {
        type: UPDATE_TRANSACTION_FEES,
        payload: transactionFees,
      };

      expect(actions.updateTransactionFees(transactionFees)).toStrictEqual(
        expectedAction,
      );
    });

    it('should create an action to update transaction totals', function () {
      const transactionTotals = { test: 123 };
      const expectedAction = {
        type: UPDATE_TRANSACTION_TOTALS,
        payload: transactionTotals,
      };

      expect(actions.updateTransactionTotals(transactionTotals)).toStrictEqual(
        expectedAction,
      );
    });

    it('should create an action to update nonce', function () {
      const nonce = '0x1';
      const expectedAction = {
        type: UPDATE_NONCE,
        payload: nonce,
      };

      expect(actions.updateNonce(nonce)).toStrictEqual(expectedAction);
    });

    it('should create an action to clear confirmTransaction', () => {
      const expectedAction = {
        type: CLEAR_CONFIRM_TRANSACTION,
      };

      expect(actions.clearConfirmTransaction()).toStrictEqual(expectedAction);
    });
  });

  describe('Thunk actions', () => {
    beforeEach(() => {
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

    it('updates txData and updates gas values in confirmTransaction', () => {
      const txData = {
        history: [],
        id: 2603411941761054,
        loadingDefaults: false,
        chainId: '0x5',
        origin: 'faucet.metamask.io',
        status: TransactionStatus.unapproved,
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
          currentCurrency: 'usd',
          currencyRates: {
            ETH: {
              conversionRate: 468.58,
            },
          },
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
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
            decimals: '',
            symbol: '',
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
      expect(storeActions).toHaveLength(expectedActions.length);
      storeActions.forEach((action, index) =>
        expect(action.type).toStrictEqual(expectedActions[index]),
      );
    });

    it('updates confirmTransaction transaction', () => {
      const mockState = {
        metamask: {
          currentCurrency: 'usd',
          currencyRates: {
            ETH: {
              conversionRate: 468.58,
            },
          },
          ...mockNetworkState({ chainId: CHAIN_IDS.GOERLI }),
          transactions: [
            {
              history: [],
              id: 2603411941761054,
              loadingDefaults: false,
              chainId: '0x5',
              origin: 'faucet.metamask.io',
              status: TransactionStatus.unapproved,
              time: 1530838113716,
              txParams: {
                from: '0xc5ae6383e126f901dcb06131d97a88745bfa88d6',
                gas: '0x33450',
                gasPrice: '0x2540be400',
                to: '0x81b7e08f65bdf5648606c89998a9cc8164397647',
                value: '0xde0b6b3a7640000',
              },
            },
          ],
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
      expect(storeActions).toHaveLength(expectedActions.length);

      storeActions.forEach((action, index) =>
        expect(action.type).toStrictEqual(expectedActions[index]),
      );
    });
  });
});
