import assert from 'assert'
import {
  getMaxModeOn,
} from '../amount-max-button.selectors.js'

describe('amount-max-button selectors', function () {

  describe('getMaxModeOn()', function () {
    it('should', function () {
      const state = {
        metamask: {
          send: {
            maxModeOn: null,
          },
        },
      }

      assert.equal(getMaxModeOn(state), null)
    })
  })

})
