// var jsdom = require('mocha-jsdom')
var assert = require('assert')
var freeze = require('deep-freeze-strict')
var path = require('path')

var actions = require(path.join(__dirname, '..', '..', '..', 'ui', 'app', 'store', 'actions.js'))
var reducers = require(path.join(__dirname, '..', '..', '..', 'ui', 'app', 'ducks', 'index.js'))

describe('SET_SELECTED_ACCOUNT', function () {
  it('sets the state.appState.activeAddress property of the state to the action.value', function () {
    var initialState = {
      appState: {
        activeAddress: 'foo',
      },
    }
    freeze(initialState)

    const action = {
      type: actions.SET_SELECTED_ACCOUNT,
      value: 'bar',
    }
    freeze(action)

    var resultingState = reducers(initialState, action)
    assert.equal(resultingState.appState.activeAddress, action.value)
  })
})

describe('SHOW_ACCOUNT_DETAIL', function () {
  it('updates metamask state', function () {
    var initialState = {
      metamask: {
        selectedAddress: 'foo',
      },
    }
    freeze(initialState)

    const action = {
      type: actions.SHOW_ACCOUNT_DETAIL,
      value: 'bar',
    }
    freeze(action)

    var resultingState = reducers(initialState, action)
    assert.equal(resultingState.metamask.selectedAddress, action.value)
  })
})
