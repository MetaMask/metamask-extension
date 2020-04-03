import assert from 'assert'
import {
  gasAndCollateralFeeIsInError,
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

  describe('gasAndCollateralFeeIsInError()', function () {
    it('should return true if send.errors.gasAndCollateralFee is truthy', function () {
      const state = {
        send: {
          errors: {
            gasAndCollateralFee: 'def',
          },
        },
      }

      assert.equal(gasAndCollateralFeeIsInError(state), true)
    })

    it('should return false send.errors.gasAndCollateralFee is falsely', function () {
      const state = {
        send: {
          errors: {
            gasAndCollateralFee: null,
          },
        },
      }

      assert.equal(gasAndCollateralFeeIsInError(state), false)
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
