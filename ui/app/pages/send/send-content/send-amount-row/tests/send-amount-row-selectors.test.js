import assert from 'assert'
import {
  sendAmountIsInError,
} from '../send-amount-row.selectors.js'

describe('send-amount-row selectors', function () {

  describe('sendAmountIsInError()', function () {
    it('should return true if send.errors.amount is truthy', function () {
      const state = {
        send: {
          errors: {
            amount: 'abc',
          },
        },
      }

      assert.equal(sendAmountIsInError(state), true)
    })

    it('should return false if send.errors.amount is falsy', function () {
      const state = {
        send: {
          errors: {
            amount: null,
          },
        },
      }

      assert.equal(sendAmountIsInError(state), false)
    })
  })

})
