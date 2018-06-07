import assert from 'assert'
import {
  getFromDropdownOpen,
} from '../send-from-row.selectors.js'

describe('send-from-row selectors', () => {

  describe('getFromDropdownOpen()', () => {
    it('should get send.fromDropdownOpen', () => {
      const state = {
        send: {
          fromDropdownOpen: null,
        },
      }

      assert.equal(getFromDropdownOpen(state), null)
    })
  })

})
