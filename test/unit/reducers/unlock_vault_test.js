import assert from 'assert'
import sinon from 'sinon'
import * as actions from '../../../ui/app/store/actions'
import reducers from '../../../ui/app/ducks'

describe('#unlockMetamask(selectedAccount)', function () {
  beforeEach(function () {
    // sinon allows stubbing methods that are easily verified
    this.sinon = sinon.createSandbox()
  })

  afterEach(function () {
    // sinon requires cleanup otherwise it will overwrite context
    this.sinon.restore()
  })

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
