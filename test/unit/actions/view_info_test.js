// var jsdom = require('mocha-jsdom')
var assert = require('assert')
var freeze = require('deep-freeze-strict')
var path = require('path')

var actions = require(path.join(__dirname, '..', '..', '..', 'ui', 'app', 'store', 'actions.js'))
var reducers = require(path.join(__dirname, '..', '..', '..', 'ui', 'app', 'ducks', 'index.js'))

describe('SHOW_INFO_PAGE', function () {
  it('sets the state.appState.currentView.name property to info', function () {
    var initialState = {
      appState: {
        activeAddress: 'foo',
      },
    }
    freeze(initialState)

    const action = actions.showInfoPage()
    var resultingState = reducers(initialState, action)
    assert.equal(resultingState.appState.currentView.name, 'info')
  })
})
