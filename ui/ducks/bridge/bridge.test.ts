import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
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
} from './actions';

const middleware = [thunk];

describe('Ducks - Bridge', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const store = configureMockStore<any>(middleware)(createBridgeMockStore());

  beforeEach(() => {
    store.clearActions();
  });

  describe('setToChain', () => {
    it('calls the "bridge/setToChainId" action and the selectDestNetwork background action', () => {
      const state = store.getState().bridge;
      const actionPayload = CHAIN_IDS.OPTIMISM;

      const mockSelectDestNetwork = jest.fn().mockReturnValue({});
      setBackgroundConnection({
        [BridgeUserAction.SELECT_DEST_NETWORK]: mockSelectDestNetwork,
      } as never);

      store.dispatch(setToChain(actionPayload as never) as never);

      // Check redux state
      const actions = store.getActions();
      expect(actions[0].type).toBe('bridge/setToChainId');
      const newState = bridgeReducer(state, actions[0]);
      expect(newState.toChainId).toBe(actionPayload);
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
      store.dispatch(setFromToken(actionPayload));
      const actions = store.getActions();
      expect(actions[0].type).toBe('bridge/setFromToken');
      const newState = bridgeReducer(state, actions[0]);
      expect(newState.fromToken).toBe(actionPayload);
    });
  });

  describe('setToToken', () => {
    it('calls the "bridge/setToToken" action', () => {
      const state = store.getState().bridge;
      const actionPayload = { symbol: 'SYMBOL', address: '0x13341431' };
      store.dispatch(setToToken(actionPayload));
      const actions = store.getActions();
      expect(actions[0].type).toBe('bridge/setToToken');
      const newState = bridgeReducer(state, actions[0]);
      expect(newState.toToken).toBe(actionPayload);
    });
  });

  describe('setFromTokenInputValue', () => {
    it('calls the "bridge/setFromTokenInputValue" action', () => {
      const state = store.getState().bridge;
      const actionPayload = '10';
      store.dispatch(setFromTokenInputValue(actionPayload));
      const actions = store.getActions();
      expect(actions[0].type).toBe('bridge/setFromTokenInputValue');
      const newState = bridgeReducer(state, actions[0]);
      expect(newState.fromTokenInputValue).toBe(actionPayload);
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
});
