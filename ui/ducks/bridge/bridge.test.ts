import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { zeroAddress } from 'ethereumjs-util';
import { createBridgeMockStore } from '../../../test/jest/mock-store';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { setBackgroundConnection } from '../../store/background-connection';
import {
  BridgeBackgroundAction,
  BridgeUserAction,
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../app/scripts/controllers/bridge/types';
import bridgeReducer from './bridge';
import {
  setBridgeFeatureFlags,
  setFromToken,
  setFromTokenInputValue,
  setToChain,
  setToToken,
  setFromChain,
  resetInputFields,
  setToChainId,
  updateQuoteRequestParams,
} from './actions';

const middleware = [thunk];

describe('Ducks - Bridge', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const store = configureMockStore<any>(middleware)(createBridgeMockStore());

  beforeEach(() => {
    store.clearActions();
  });

  describe('setToChainId', () => {
    it('calls the "bridge/setToChainId" action', () => {
      const state = store.getState().bridge;
      const actionPayload = CHAIN_IDS.OPTIMISM;

      store.dispatch(setToChainId(actionPayload as never) as never);

      // Check redux state
      const actions = store.getActions();
      expect(actions[0].type).toStrictEqual('bridge/setToChainId');
      const newState = bridgeReducer(state, actions[0]);
      expect(newState.toChainId).toStrictEqual(actionPayload);
    });
  });

  describe('setToChain', () => {
    it('calls the selectDestNetwork background action', () => {
      const actionPayload = CHAIN_IDS.OPTIMISM;

      const mockSelectDestNetwork = jest.fn().mockReturnValue({});
      setBackgroundConnection({
        [BridgeUserAction.SELECT_DEST_NETWORK]: mockSelectDestNetwork,
      } as never);

      store.dispatch(setToChain(actionPayload as never) as never);

      // Check background state
      expect(mockSelectDestNetwork).toHaveBeenCalledTimes(1);
      expect(mockSelectDestNetwork).toHaveBeenCalledWith(
        '0xa',
        expect.anything(),
      );
    });
  });

  describe('setFromToken', () => {
    it('calls the "bridge/setFromToken" action', () => {
      const state = store.getState().bridge;
      const actionPayload = { symbol: 'SYMBOL', address: '0x13341432' };
      store.dispatch(setFromToken(actionPayload as never) as never);
      const actions = store.getActions();
      expect(actions[0].type).toStrictEqual('bridge/setFromToken');
      const newState = bridgeReducer(state, actions[0]);
      expect(newState.fromToken).toStrictEqual(actionPayload);
    });
  });

  describe('setToToken', () => {
    it('calls the "bridge/setToToken" action', () => {
      const state = store.getState().bridge;
      const actionPayload = { symbol: 'SYMBOL', address: '0x13341431' };

      store.dispatch(setToToken(actionPayload as never) as never);
      const actions = store.getActions();
      expect(actions[0].type).toStrictEqual('bridge/setToToken');
      const newState = bridgeReducer(state, actions[0]);
      expect(newState.toToken).toStrictEqual(actionPayload);
    });
  });

  describe('setFromTokenInputValue', () => {
    it('calls the "bridge/setFromTokenInputValue" action', () => {
      const state = store.getState().bridge;
      const actionPayload = '10';

      store.dispatch(setFromTokenInputValue(actionPayload as never) as never);
      const actions = store.getActions();
      expect(actions[0].type).toStrictEqual('bridge/setFromTokenInputValue');
      const newState = bridgeReducer(state, actions[0]);
      expect(newState.fromTokenInputValue).toStrictEqual(actionPayload);
    });
  });

  describe('setBridgeFeatureFlags', () => {
    it('should call setBridgeFeatureFlags in the background', async () => {
      const mockSetBridgeFeatureFlags = jest.fn();
      setBackgroundConnection({
        [BridgeBackgroundAction.SET_FEATURE_FLAGS]: mockSetBridgeFeatureFlags,
      } as never);
      store.dispatch(setBridgeFeatureFlags() as never);
      expect(mockSetBridgeFeatureFlags).toHaveBeenCalledTimes(1);
    });
  });

  describe('setFromChain', () => {
    it('calls the selectSrcNetwork background action', async () => {
      const mockSelectSrcNetwork = jest.fn().mockReturnValue({});
      setBackgroundConnection({
        [BridgeUserAction.SELECT_SRC_NETWORK]: mockSelectSrcNetwork,
      } as never);

      await store.dispatch(setFromChain(CHAIN_IDS.MAINNET) as never);

      expect(mockSelectSrcNetwork).toHaveBeenCalledTimes(1);
      expect(mockSelectSrcNetwork).toHaveBeenCalledWith(
        '0x1',
        expect.anything(),
      );
    });
  });

  describe('resetInputFields', () => {
    it('resets to initalState', async () => {
      const state = store.getState().bridge;
      store.dispatch(resetInputFields());
      const actions = store.getActions();
      expect(actions[0].type).toStrictEqual('bridge/resetInputFields');
      const newState = bridgeReducer(state, actions[0]);
      expect(newState).toStrictEqual({
        toChainId: null,
        fromToken: null,
        toToken: null,
        fromTokenInputValue: null,
      });
    });
  });

  describe('updateQuoteRequestParams', () => {
    it('dispatches quote params to the bridge controller', () => {
      const mockUpdateParams = jest.fn();
      setBackgroundConnection({
        [BridgeUserAction.UPDATE_QUOTE_PARAMS]: mockUpdateParams,
      } as never);

      store.dispatch(
        updateQuoteRequestParams({
          srcChainId: 1,
          srcTokenAddress: zeroAddress(),
          destTokenAddress: undefined,
        }) as never,
      );

      expect(mockUpdateParams).toHaveBeenCalledTimes(1);
      expect(mockUpdateParams).toHaveBeenCalledWith(
        {
          srcChainId: 1,
          srcTokenAddress: zeroAddress(),
          destTokenAddress: undefined,
        },
        expect.anything(),
      );
    });
  });
});
