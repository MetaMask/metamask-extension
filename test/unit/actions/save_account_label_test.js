var jsdom = require('mocha-jsdom')
var assert = require('assert')
var freeze = require('deep-freeze-strict')
var path = require('path')

var actions = require(path.join(__dirname, '..', '..', '..', 'ui', 'app', 'actions.js'))
var reducers = require(path.join(__dirname, '..', '..',  '..', 'ui', 'app', 'reducers.js'))

describe('SAVE_ACCOUNT_LABEL', function() {

  it('updates the state.metamask.identities[:i].name property of the state to the action.value.label', function() {
    var initialState = {
      metamask: {
        identities: {
          foo: {
            name: 'bar'
          }
        },
      }
    }
    freeze(initialState)

    const action = {
      type: actions.SAVE_ACCOUNT_LABEL,
      value: {
        account: 'foo',
        label: 'baz'
      },
    }
    freeze(action)

    var resultingState = reducers(initialState, action)
    assert.equal(resultingState.metamask.identities.foo.name, action.value.label)
  });
});

