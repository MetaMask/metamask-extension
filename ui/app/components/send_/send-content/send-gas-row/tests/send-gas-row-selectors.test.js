import assert from 'assert'
import {
  sendGasIsInError,
} from '../send-gas-row.selectors.js'

describe('send-gas-row selectors', () => {

  describe('sendGasIsInError()', () => {
    it('should return send.errors.gasLoading', () => {
      const state = {
        send: {
          errors: {
            gasLoading: 'abc',
          },
        },
      }

      assert.equal(sendGasIsInError(state), 'abc')
    })
  })

})
