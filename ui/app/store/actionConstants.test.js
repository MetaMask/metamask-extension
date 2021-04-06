import assert from 'assert';
import freeze from 'deep-freeze-strict';
import reducers from '../ducks';
import { NETWORK_TYPE_RPC } from '../../../shared/constants/network';
import * as actionConstants from './actionConstants';

describe('Redux actionConstants', function () {
  describe('SET_RPC_TARGET', function () {
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
    it('sets the state.metamask.rpcUrl property of the state to the action.value', function () {
      const action = {
        type: actionConstants.SET_RPC_TARGET,
        value: 'foo',
      };

      const result = reducers(initialState, action);
      assert.equal(result.metamask.provider.type, NETWORK_TYPE_RPC);
      assert.equal(result.metamask.provider.rpcUrl, 'foo');
    });
  });

  describe('SET_ACCOUNT_LABEL', function () {
    it('updates the state.metamask.identities[:i].name property of the state to the action.value.label', function () {
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
      assert.equal(
        resultingState.metamask.identities.foo.name,
        action.value.label,
      );
    });
  });

  describe('SHOW_ACCOUNT_DETAIL', function () {
    it('updates metamask state', function () {
      const initialState = {
        metamask: {
          selectedAddress: 'foo',
        },
      };
      freeze(initialState);

      const action = {
        type: actionConstants.SHOW_ACCOUNT_DETAIL,
        value: 'bar',
      };
      freeze(action);

      const resultingState = reducers(initialState, action);
      assert.equal(resultingState.metamask.selectedAddress, action.value);
    });
  });
});
