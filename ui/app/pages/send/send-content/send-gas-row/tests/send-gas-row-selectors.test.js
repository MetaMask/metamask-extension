import assert from 'assert'
import {
  gasFeeIsInError,
  getGasLoadingError,
  getGasButtonGroupShown,
} from '../send-gas-row.selectors.js'

describe('send-gas-row selectors', () => {

  describe('getGasLoadingError()', () => {
    it('should return send.errors.gasLoading', () => {
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

  describe('gasFeeIsInError()', () => {
    it('should return true if send.errors.gasFee is truthy', () => {
      const state = {
        send: {
          errors: {
            gasFee: 'def',
          },
        },
      }

      assert.equal(gasFeeIsInError(state), true)
    })

    it('should return false send.errors.gasFee is falsely', () => {
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

  describe('getGasButtonGroupShown()', () => {
    it('should return send.gasButtonGroupShown', () => {
      const state = {
        send: {
          gasButtonGroupShown: 'foobar',
        },
      }

      assert.equal(getGasButtonGroupShown(state), 'foobar')
    })
  })

})
