import assert from 'assert'
import {
  sendAmountIsInError,
} from '../send-amount-row.selectors.js'

describe('send-amount-row selectors', () => {

  describe('sendAmountIsInError()', () => {
    it('should return true if send.errors.amount is truthy', () => {
      const state = {
        send: {
          errors: {
            amount: 'abc',
          },
        },
      }

      assert.equal(sendAmountIsInError(state), true)
    })

    it('should return false if send.errors.amount is falsy', () => {
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
