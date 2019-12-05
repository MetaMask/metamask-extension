// var jsdom = require('mocha-jsdom')
const assert = require('assert')
const freeze = require('deep-freeze-strict')
const path = require('path')

const actions = require(path.join(__dirname, '..', '..', '..', 'ui', 'app', 'store', 'actions.js'))
const reducers = require(path.join(__dirname, '..', '..', '..', 'ui', 'app', 'ducks', 'index.js'))

describe('SHOW_INFO_PAGE', function () {
  it('sets the state.appState.currentView.name property to info', function () {
    const initialState = {
      appState: {
        activeAddress: 'foo',
      },
    }
    freeze(initialState)

    const action = actions.showInfoPage()
    const resultingState = reducers(initialState, action)
    assert.equal(resultingState.appState.currentView.name, 'info')
  })
})
