import assert from 'assert'
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import * as actions from '../../../ui/app/store/actions'
import * as actionConstants from '../../../ui/app/store/actionConstants'

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

describe('tx confirmation screen', function () {
  const txId = 1457634084250832
  const initialState = {
    appState: {
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
    it('creates COMPLETED_TX with the cancelled transaction ID', async function () {
      actions._setBackgroundConnection({
        approveTransaction (_, cb) {
          cb('An error!')
        },
        cancelTransaction (_, cb) {
          cb()
        },
        getState (cb) {
          cb(null, {})
        },
      })

      await store.dispatch(actions.cancelTx({ id: txId }))
      const storeActions = store.getActions()
      const completedTxAction = storeActions.find(({ type }) => type === actionConstants.COMPLETED_TX)
      const { id } = completedTxAction.value
      assert.equal(id, txId)
    })
  })
})
