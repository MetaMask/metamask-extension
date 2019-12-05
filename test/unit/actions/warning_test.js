// var jsdom = require('mocha-jsdom')
var assert = require('assert')
var freeze = require('deep-freeze-strict')
var path = require('path')

var actions = require(path.join(__dirname, '..', '..', '..', 'ui', 'app', 'store', 'actions.js'))
var reducers = require(path.join(__dirname, '..', '..', '..', 'ui', 'app', 'ducks', 'index.js'))

describe('action DISPLAY_WARNING', function () {
  it('sets appState.warning to provided value', function () {
    var initialState = {
      appState: {},
    }
    freeze(initialState)

    const warningText = 'This is a sample warning message'

    const action = actions.displayWarning(warningText)
    const resultingState = reducers(initialState, action)

    assert.equal(resultingState.appState.warning, warningText, 'warning text set')
  })
})
