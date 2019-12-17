// var jsdom = require('mocha-jsdom')
const assert = require('assert')
const freeze = require('deep-freeze-strict')
const path = require('path')

const actions = require(path.join(__dirname, '..', '..', '..', 'ui', 'app', 'store', 'actions.js'))
const reducers = require(path.join(__dirname, '..', '..', '..', 'ui', 'app', 'ducks', 'index.js'))

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

  describe('SHOW_CONFIG_PAGE', function () {
    it('should set appState.currentView.name to config', function () {
      const result = reducers(initialState, actions.showConfigPage())
      assert.equal(result.appState.currentView.name, 'config')
    })
  })

  describe('SET_RPC_TARGET', function () {
    it('sets the state.metamask.rpcTarget property of the state to the action.value', function () {
      const action = {
        type: actions.SET_RPC_TARGET,
        value: 'foo',
      }

      const result = reducers(initialState, action)
      assert.equal(result.metamask.provider.type, 'rpc')
      assert.equal(result.metamask.provider.rpcTarget, 'foo')
    })
  })
})
