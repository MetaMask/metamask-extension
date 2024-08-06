import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { createBridgeMockStore } from '../../../test/jest/mock-store';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { setBackgroundConnection } from '../../store/background-connection';
import { BridgeBackgroundAction } from '../../../app/scripts/controllers/bridge/types';
import bridgeReducer from './bridge';
import { setBridgeFeatureFlags, setToChain } from './actions';

const middleware = [thunk];

describe('Ducks - Bridge', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const store = configureMockStore<any>(middleware)(createBridgeMockStore());

  describe('setToChain', () => {
    it('calls the "bridge/setToChain" action', () => {
      const state = store.getState().bridge;
      const actionPayload = CHAIN_IDS.BSC;
      store.dispatch(setToChain(actionPayload));
      const actions = store.getActions();
      expect(actions[0].type).toBe('bridge/setToChain');
      const newState = bridgeReducer(state, actions[0]);
      expect(newState.toChain).toBe(actionPayload);
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
