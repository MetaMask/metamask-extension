// var jsdom = require('mocha-jsdom')
var assert = require('assert')
var freeze = require('deep-freeze-strict')
var path = require('path')
var sinon = require('sinon')

var actions = require(path.join(__dirname, '..', '..', '..', 'ui', 'app', 'actions.js'))
var reducers = require(path.join(__dirname, '..', '..', '..', 'ui', 'app', 'reducers.js'))

describe('tx confirmation screen', function () {
  beforeEach(function () {
    this.sinon = sinon.sandbox.create()
  })

  afterEach(function () {
    this.sinon.restore()
  })

  var initialState, result

  describe('when there is only one tx', function () {
    var firstTxId = 1457634084250832

    beforeEach(function () {
      initialState = {
        appState: {
          currentView: {
            name: 'confTx',
          },
        },
        metamask: {
          unapprovedTxs: {
            '1457634084250832': {
              id: 1457634084250832,
              status: 'unconfirmed',
              time: 1457634084250,
            },
          },
        },
      }
      freeze(initialState)
    })

    describe('cancelTx', function () {
      before(function (done) {
        actions._setBackgroundConnection({
          approveTransaction (txId, cb) { cb('An error!') },
          cancelTransaction (txId, cb) { cb() },
          clearSeedWordCache (cb) { cb() },
        })

        let action
        actions.cancelTx({value: firstTxId})((dispatchAction) => {
          action = dispatchAction
        })
        result = reducers(initialState, action)
        done()
      })

      it('should transition to the account detail view', function () {
        assert.equal(result.appState.currentView.name, 'accountDetail')
      })

      it('should have no unconfirmed txs remaining', function () {
        var count = getUnconfirmedTxCount(result)
        assert.equal(count, 0)
      })
    })

    describe('sendTx', function () {
      var result

      describe('when there is an error', function () {
        before(function (done) {
          actions._setBackgroundConnection({
            approveTransaction (txId, cb) { cb({message: 'An error!'}) },
          })

          actions.sendTx({id: firstTxId})(function (action) {
            result = reducers(initialState, action)
            done()
          })
        })

        it('should stay on the page', function () {
          assert.equal(result.appState.currentView.name, 'confTx')
        })

        it('should set errorMessage on the currentView', function () {
          assert(result.appState.currentView.errorMessage)
        })
      })

      describe('when there is success', function () {
        it('should complete tx and go home', function () {
          actions._setBackgroundConnection({
            approveTransaction (txId, cb) { cb() },
          })

          var dispatchExpect = sinon.mock()
          dispatchExpect.twice()

          actions.sendTx({id: firstTxId})(dispatchExpect)
        })
      })
    })

    describe('when there are two pending txs', function () {
      var firstTxId = 1457634084250832
      var result, initialState
      before(function (done) {
        initialState = {
          appState: {
            currentView: {
              name: 'confTx',
            },
          },
          metamask: {
            unapprovedTxs: {
              '1457634084250832': {
                id: firstTxId,
                status: 'unconfirmed',
                time: 1457634084250,
              },
              '1457634084250833': {
                id: 1457634084250833,
                status: 'unconfirmed',
                time: 1457634084255,
              },
            },
          },
        }
        freeze(initialState)

        // Mocking a background connection:
        actions._setBackgroundConnection({
          approveTransaction (firstTxId, cb) { cb() },
        })

        actions.sendTx({id: firstTxId})(function (action) {
          result = reducers(initialState, action)
        })
        done()
      })

      it('should stay on the confTx view', function () {
        assert.equal(result.appState.currentView.name, 'confTx')
      })

      it('should transition to the first tx', function () {
        assert.equal(result.appState.currentView.context, 0)
      })
    })
  })
})

function getUnconfirmedTxCount (state) {
  var txs = state.metamask.unapprovedTxs
  var count = Object.keys(txs).length
  return count
}
