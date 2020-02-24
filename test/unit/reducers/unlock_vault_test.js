<<<<<<< HEAD
// var jsdom = require('mocha-jsdom')
var assert = require('assert')
// var freeze = require('deep-freeze-strict')
var path = require('path')
var sinon = require('sinon')

var actions = require(path.join(__dirname, '..', '..', '..', 'ui', 'app', 'store', 'actions.js'))
var reducers = require(path.join(__dirname, '..', '..', '..', 'ui', 'app', 'ducks', 'index.js'))
=======
import assert from 'assert'
import * as actions from '../../../ui/app/store/actions'
import reducers from '../../../ui/app/ducks'
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

describe('#unlockMetamask(selectedAccount)', function () {
  describe('after an error', function () {
    it('clears warning', function () {
      const warning = 'this is the wrong warning'
      const account = 'foo_account'
      const initialState = {
        appState: {
          warning: warning,
        },
      }

      const resultState = reducers(initialState, actions.unlockMetamask(account))
      assert.equal(resultState.appState.warning, null, 'warning nullified')
    })
  })

  describe('going home after an error', function () {
    it('clears warning', function () {
      const warning = 'this is the wrong warning'
      // const account = 'foo_account'
      const initialState = {
        appState: {
          warning: warning,
        },
      }

      const resultState = reducers(initialState, actions.goHome())
      assert.equal(resultState.appState.warning, null, 'warning nullified')
    })
  })
})
