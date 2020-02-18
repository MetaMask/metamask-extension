import assert from 'assert'
import * as actions from '../../../ui/app/store/actions'
import reducers from '../../../ui/app/ducks'

describe('#unlockMetamask(selectedAccount)', function () {
  describe('after an error', function () {
    it('clears warning', function () {
      const warning = 'this is the wrong warning'
      const account = 'foo_account'
      const initialState = {
        appState: {
          warning: warning,
        },
      }

      const resultState = reducers(initialState, actions.unlockMetamask(account))
      assert.equal(resultState.appState.warning, null, 'warning nullified')
    })
  })

  describe('going home after an error', function () {
    it('clears warning', function () {
      const warning = 'this is the wrong warning'
      // const account = 'foo_account'
      const initialState = {
        appState: {
          warning: warning,
        },
      }

      const resultState = reducers(initialState, actions.goHome())
      assert.equal(resultState.appState.warning, null, 'warning nullified')
    })
  })
})
