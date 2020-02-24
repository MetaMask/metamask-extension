import assert from 'assert'
import {
  gasFeeIsInError,
  getGasLoadingError,
  getGasButtonGroupShown,
} from '../send-gas-row.selectors.js'

describe('send-gas-row selectors', function () {

  describe('getGasLoadingError()', function () {
    it('should return send.errors.gasLoading', function () {
      const state = {
        send: {
          errors: {
            gasLoading: 'abc',
          },
        },
      }

      assert.equal(getGasLoadingError(state), 'abc')
    })
  })

  describe('gasFeeIsInError()', function () {
    it('should return true if send.errors.gasFee is truthy', function () {
      const state = {
        send: {
          errors: {
            gasFee: 'def',
          },
        },
      }

      assert.equal(gasFeeIsInError(state), true)
    })

    it('should return false send.errors.gasFee is falsely', function () {
      const state = {
        send: {
          errors: {
            gasFee: null,
          },
        },
      }

      assert.equal(gasFeeIsInError(state), false)
    })
  })

  describe('getGasButtonGroupShown()', function () {
    it('should return send.gasButtonGroupShown', function () {
      const state = {
        send: {
          gasButtonGroupShown: 'foobar',
        },
      }

      assert.equal(getGasButtonGroupShown(state), 'foobar')
    })
  })

})
