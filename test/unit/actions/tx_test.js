import assert from 'assert'
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import * as actions from '../../../ui/app/store/actions'

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

describe('tx confirmation screen', function () {
  const txId = 1457634084250832
  const initialState = {
    appState: {
      currentView: {
        name: 'confTx',
      },
    },
    metamask: {
      unapprovedTxs: {
        [txId]: {
          id: txId,
          status: 'unconfirmed',
          time: 1457634084250,
        },
      },
    },
  }

  const store = mockStore(initialState)

  describe('cancelTx', function () {
    before(function (done) {
      actions._setBackgroundConnection({
        approveTransaction (_, cb) {
          cb('An error!')
        },
        cancelTransaction (_, cb) {
          cb()
        },
        getState (cb) {
          cb()
        },
      })
      done()
    })

    it('creates COMPLETED_TX with the cancelled transaction ID', function (done) {
      store.dispatch(actions.cancelTx({ id: txId }))
        .then(() => {
          const storeActions = store.getActions()
          const completedTxAction = storeActions.find(({ type }) => type === actions.actionConstants.COMPLETED_TX)
          assert.equal(completedTxAction.value, txId)
          done()
        })
    })
  })
})
