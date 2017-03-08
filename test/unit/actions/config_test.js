var jsdom = require('mocha-jsdom')
var assert = require('assert')
var freeze = require('deep-freeze-strict')
var path = require('path')

var actions = require(path.join(__dirname, '..', '..', '..', 'ui', 'app', 'actions.js'))
var reducers = require(path.join(__dirname, '..', '..',  '..', 'ui', 'app', 'reducers.js'))

describe ('config view actions', function() {

  var initialState = {
    metamask: {
      rpcTarget: 'foo',
      frequentRpcList: []
    },
    appState: {
      currentView: {
        name: 'accounts',
      }
    }
  }
  freeze(initialState)

  describe('SHOW_CONFIG_PAGE', function() {
    it('should set appState.currentView.name to config', function() {
      var result = reducers(initialState, actions.showConfigPage())
      assert.equal(result.appState.currentView.name, 'config')
    })
  })

  describe('SET_RPC_TARGET', function() {

    it('sets the state.metamask.rpcTarget property of the state to the action.value', function() {
      const action = {
        type: actions.SET_RPC_TARGET,
        value: 'foo',
      }

      var result = reducers(initialState, action)
      result = reducers(result, secondAction)
      assert.equal(result.metamask.provider.type, 'rpc')
      assert.equal(result.metamask.provider.rpcTarget, 'foo')
    })

    it('should handle multiple requests to change the rpc gracefully', function() {
      const action = {
        type: actions.SET_RPC_TARGET,
        value: 'foo',
      }

      const secondAction = {
        type: actions.SET_RPC_LIST,
        value: ['foo'],
      }

      var result = reducers(initialState, action)
      var secondResult = reducers(result, action)
      assert.equal(secondResult.metamask.frequentRpcList.length, 1)
    })
  })

})
