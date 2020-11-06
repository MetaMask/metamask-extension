import assert from 'assert'
import { calcMaxAmount } from '../amount-max-button.utils'

describe('amount-max-button utils', function () {
  describe('calcMaxAmount()', function () {
    it('should calculate the correct amount when no sendToken defined', function () {
      assert.deepEqual(
        calcMaxAmount({
          balance: 'ffffff',
          gasTotal: 'ff',
          sendToken: false,
        }),
        'ffff00',
      )
    })

    it('should calculate the correct amount when a sendToken is defined', function () {
      assert.deepEqual(
        calcMaxAmount({
          sendToken: {
            decimals: 10,
          },
          tokenBalance: '64',
        }),
        'e8d4a51000',
      )
    })
  })
})
