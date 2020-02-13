import assert from 'assert'
import {
  getToDropdownOpen,
  getTokens,
  sendToIsInError,
} from '../add-recipient.selectors.js'

describe('add-recipient selectors', function () {

  describe('getToDropdownOpen()', function () {
    it('should return send.getToDropdownOpen', function () {
      const state = {
        send: {
          toDropdownOpen: false,
        },
      }

      assert.equal(getToDropdownOpen(state), false)
    })
  })

  describe('sendToIsInError()', function () {
    it('should return true if send.errors.to is truthy', function () {
      const state = {
        send: {
          errors: {
            to: 'abc',
          },
        },
      }

      assert.equal(sendToIsInError(state), true)
    })

    it('should return false if send.errors.to is falsy', function () {
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

  describe('getTokens()', function () {
    it('should return empty array if no tokens in state', function () {
      const state = {
        metamask: {
          tokens: [],
        },
      }

      assert.deepStrictEqual(getTokens(state), [])
    })
  })
})
