// const jsdom = require('mocha-jsdom')
const assert = require('assert')
const freeze = require('deep-freeze-strict')
const path = require('path')
const sinon = require('sinon')

const actions = require(path.join(__dirname, '..', '..', '..', 'ui', 'app', 'actions.js'))
const reducers = require(path.join(__dirname, '..', '..', '..', 'ui', 'app', 'reducers.js'))

describe('tx confirmation screen', function () {
  beforeEach(function () {
    this.sinon = sinon.createSandbox()
  })

  afterEach(function () {
    this.sinon.restore()
  })

  let initialState, result

  describe('when there is only one tx', function () {
    const firstTxId = 1457634084250832

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

        actions.cancelTx({value: firstTxId})((action) => {
          result = reducers(initialState, action)
        })
        done()
      })

      it('should transition to the account detail view', function () {
        assert.equal(result.appState.currentView.name, 'accountDetail')
      })

      it('should have no unconfirmed txs remaining', function () {
        const count = getUnconfirmedTxCount(result)
        assert.equal(count, 0)
      })
    })
  })
})

function getUnconfirmedTxCount (state) {
  const txs = state.metamask.unapprovedTxs
  return Object.keys(txs).length
}
