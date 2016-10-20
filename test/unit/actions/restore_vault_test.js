var jsdom = require('mocha-jsdom')
var assert = require('assert')
var freeze = require('deep-freeze-strict')
var path = require('path')
var sinon = require('sinon')

var actions = require(path.join(__dirname, '..', '..', '..', 'ui', 'app', 'actions.js'))
var reducers = require(path.join(__dirname, '..', '..',  '..', 'ui', 'app', 'reducers.js'))

describe('#recoverFromSeed(password, seed)', function() {

  beforeEach(function() {
    // sinon allows stubbing methods that are easily verified
    this.sinon = sinon.sandbox.create()
  })

  afterEach(function() {
    // sinon requires cleanup otherwise it will overwrite context
    this.sinon.restore()
  })

  // stub out account manager
  actions._setKeyringController({
    recoverFromSeed(pw, seed, cb) {
      cb(null, {
        identities: {
          foo: 'bar'
        }
      })
    },
  })

  it('sets metamask.isUnlocked to true', function() {
    var initialState = {
      metamask: {
        isUnlocked: false,
        isInitialized: false,
      }
    }
    freeze(initialState)

    const restorePhrase = 'invite heavy among daring outdoor dice jelly coil stable note seat vicious'
    const password = 'foo'
    const dispatchFunc = actions.recoverFromSeed(password, restorePhrase)

    var dispatchStub = this.sinon.stub()
    dispatchStub.withArgs({ TYPE: actions.unlockMetamask() }).onCall(0)
    dispatchStub.withArgs({ TYPE: actions.showAccountsPage() }).onCall(1)

    var action
    var resultingState = initialState
    dispatchFunc((newAction) => {
      action = newAction
      resultingState = reducers(resultingState, action)
    })

    assert.equal(resultingState.metamask.isUnlocked, true, 'was unlocked')
    assert.equal(resultingState.metamask.isInitialized, true, 'was initialized')
  });
});
