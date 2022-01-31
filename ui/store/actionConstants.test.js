import freeze from 'deep-freeze-strict';
import reducers from '../ducks';
import { NETWORK_TYPE_RPC } from '../../shared/constants/network';
import * as actionConstants from './actionConstants';

describe('Redux actionConstants', () => {
  describe('SET_RPC_TARGET', () => {
    const initialState = {
      metamask: {
        frequentRpcList: [],
        provider: {
          rpcUrl: 'bar',
        },
      },
      appState: {
        currentView: {
          name: 'accounts',
        },
      },
    };
    freeze(initialState);
    it('sets the state.metamask.rpcUrl property of the state to the action.value', () => {
      const action = {
        type: actionConstants.SET_RPC_TARGET,
        value: 'foo',
      };

      const result = reducers(initialState, action);
      expect(result.metamask.provider.type).toStrictEqual(NETWORK_TYPE_RPC);
      expect(result.metamask.provider.rpcUrl).toStrictEqual('foo');
    });
  });

  describe('SET_ACCOUNT_LABEL', () => {
    it('updates the state.metamask.identities[:i].name property of the state to the action.value.label', () => {
      const initialState = {
        metamask: {
          identities: {
            foo: {
              name: 'bar',
            },
          },
        },
      };
      freeze(initialState);

      const action = {
        type: actionConstants.SET_ACCOUNT_LABEL,
        value: {
          account: 'foo',
          label: 'baz',
        },
      };
      freeze(action);

      const resultingState = reducers(initialState, action);
      expect(resultingState.metamask.identities.foo.name).toStrictEqual(
        action.value.label,
      );
    });
  });

  describe('SHOW_ACCOUNT_DETAIL', () => {
    it('updates metamask state', () => {
      const initialState = {
        metamask: {},
      };
      freeze(initialState);

      const action = {
        type: actionConstants.SHOW_ACCOUNT_DETAIL,
        value: 'bar',
      };
      freeze(action);

      const resultingState = reducers(initialState, action);
      expect(resultingState.metamask.isUnlocked).toStrictEqual(true);
      expect(resultingState.metamask.isInitialized).toStrictEqual(true);
    });
  });
});
