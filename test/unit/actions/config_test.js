import assert from 'assert'
import freeze from 'deep-freeze-strict'
import reducers from '../../../ui/app/ducks'
import * as actions from '../../../ui/app/store/actions'

describe('config view actions', function () {
  const initialState = {
    metamask: {
      rpcTarget: 'foo',
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
    it('sets the state.metamask.rpcTarget property of the state to the action.value', function () {
      const action = {
        type: actions.actionConstants.SET_RPC_TARGET,
        value: 'foo',
      }

      const result = reducers(initialState, action)
      assert.equal(result.metamask.provider.type, 'rpc')
      assert.equal(result.metamask.provider.rpcTarget, 'foo')
    })
  })
})
