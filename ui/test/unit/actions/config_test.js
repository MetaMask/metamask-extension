var jsdom = require('mocha-jsdom')
var assert = require('assert')
var freeze = require('deep-freeze-strict')
var path = require('path')

var actions = require(path.join(__dirname, '..', '..', '..', 'app', 'actions.js'))
var reducers = require(path.join(__dirname, '..', '..', '..', 'app', 'reducers.js'))

describe ('config view actions', function() {

  var initialState = {
    metamask: {
      rpcTarget: 'foo',
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
        value: 'bar',
      }

      var result = reducers(initialState, action)
      assert.equal(result.metamask.rpcTarget, action.value)
    })
  })
})

