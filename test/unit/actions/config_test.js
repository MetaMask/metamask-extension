<<<<<<< HEAD
// var jsdom = require('mocha-jsdom')
var assert = require('assert')
var freeze = require('deep-freeze-strict')
var path = require('path')

var actions = require(path.join(__dirname, '..', '..', '..', 'ui', 'app', 'store', 'actions.js'))
var reducers = require(path.join(__dirname, '..', '..', '..', 'ui', 'app', 'ducks', 'index.js'))
=======
import assert from 'assert'
import freeze from 'deep-freeze-strict'
import reducers from '../../../ui/app/ducks'
import * as actions from '../../../ui/app/store/actions'
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

describe('config view actions', function () {
  var initialState = {
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

<<<<<<< HEAD
  describe('SHOW_CONFIG_PAGE', function () {
    it('should set appState.currentView.name to config', function () {
      var result = reducers(initialState, actions.showConfigPage())
      assert.equal(result.appState.currentView.name, 'config')
    })
  })

=======
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
  describe('SET_RPC_TARGET', function () {
    it('sets the state.metamask.rpcTarget property of the state to the action.value', function () {
      const action = {
        type: actions.actionConstants.SET_RPC_TARGET,
        value: 'foo',
      }

      var result = reducers(initialState, action)
      assert.equal(result.metamask.provider.type, 'rpc')
      assert.equal(result.metamask.provider.rpcTarget, 'foo')
    })
  })
})
