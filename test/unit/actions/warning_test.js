// var jsdom = require('mocha-jsdom')
const assert = require('assert')
const freeze = require('deep-freeze-strict')
const path = require('path')

const actions = require(path.join(__dirname, '..', '..', '..', 'ui', 'app', 'store', 'actions.js'))
const reducers = require(path.join(__dirname, '..', '..', '..', 'ui', 'app', 'ducks', 'index.js'))

describe('action DISPLAY_WARNING', function () {
  it('sets appState.warning to provided value', function () {
    const initialState = {
      appState: {},
    }
    freeze(initialState)

    const warningText = 'This is a sample warning message'

    const action = actions.displayWarning(warningText)
    const resultingState = reducers(initialState, action)

    assert.equal(resultingState.appState.warning, warningText, 'warning text set')
  })
})
