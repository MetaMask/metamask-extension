import assert from 'assert'
import {
  getToDropdownOpen,
  sendToIsInError,
} from '../send-to-row.selectors.js'

describe('send-to-row selectors', () => {

  describe('getToDropdownOpen()', () => {
    it('should return send.getToDropdownOpen', () => {
      const state = {
        send: {
          toDropdownOpen: false,
        },
      }

      assert.equal(getToDropdownOpen(state), false)
    })
  })

  describe('sendToIsInError()', () => {
    it('should return true if send.errors.to is truthy', () => {
      const state = {
        send: {
          errors: {
            to: 'abc',
          },
        },
      }

      assert.equal(sendToIsInError(state), true)
    })

    it('should return false if send.errors.to is falsy', () => {
      const state = {
        send: {
          errors: {
            to: null,
          },
        },
      }

      assert.equal(sendToIsInError(state), false)
    })
  })

})
