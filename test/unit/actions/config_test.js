import assert from 'assert'
import freeze from 'deep-freeze-strict'
import reducers from '../../../ui/app/ducks'
import * as actionConstants from '../../../ui/app/store/actionConstants'
import { NETWORK_TYPE_RPC } from '../../../shared/constants/network'

describe('config view actions', function () {
  const initialState = {
    metamask: {
      rpcUrl: 'foo',
      frequentRpcList: [],
    },
    appState: {
      currentView: {
        name: 'accounts',
      },
    },
  }
  freeze(initialState)

  describe('SET_RPC_TARGET', function () {
    it('sets the state.metamask.rpcUrl property of the state to the action.value', function () {
      const action = {
        type: actionConstants.SET_RPC_TARGET,
        value: 'foo',
      }

      const result = reducers(initialState, action)
      assert.equal(result.metamask.provider.type, NETWORK_TYPE_RPC)
      assert.equal(result.metamask.provider.rpcUrl, 'foo')
    })
  })
})
