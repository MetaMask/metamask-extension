import freeze from 'deep-freeze-strict';
import { NETWORK_TYPES } from '../../shared/constants/network';
import reducers from '../ducks';
import * as actionConstants from './actionConstants';

describe('Redux actionConstants', () => {
  describe('UPDATE_NETWORK_TARGET', () => {
    const initialState = {
      metamask: {
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
        type: actionConstants.UPDATE_NETWORK_TARGET,
        value: { rpcUrl: 'foo', networkConfigurationId: 'baz' },
      };

      const result = reducers(initialState, action);
      expect(result.metamask.provider.type).toStrictEqual(NETWORK_TYPES.RPC);
      expect(result.metamask.provider.rpcUrl).toStrictEqual('foo');
      expect(result.metamask.provider.networkConfigurationId).toStrictEqual(
        'baz',
      );
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
});
