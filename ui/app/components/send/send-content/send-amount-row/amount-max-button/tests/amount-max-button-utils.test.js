import assert from 'assert'
import {
  calcMaxAmount,
} from '../amount-max-button.utils.js'

describe('amount-max-button utils', () => {

  describe('calcMaxAmount()', () => {
    it('should calculate the correct amount when no selectedToken defined', () => {
      assert.deepEqual(calcMaxAmount({
        balance: 'ffffff',
        gasTotal: 'ff',
        selectedToken: false,
      }), 'ffff00')
    })

    it('should calculate the correct amount when a selectedToken is defined', () => {
      assert.deepEqual(calcMaxAmount({
        selectedToken: {
          decimals: 10,
        },
        tokenBalance: 100,
      }), 'e8d4a51000')
    })
  })

})
