import assert from 'assert'
import { addCurrencies } from './conversion-util'


describe('conversion utils', function () {
  describe('addCurrencies()', function () {
    it('add whole numbers', function () {
      const result = addCurrencies(3, 9)
      assert.equal(result.toNumber(), 12)
    })

    it('add decimals', function () {
      const result = addCurrencies(1.3, 1.9)
      assert.equal(result.toNumber(), 3.2)
    })

    it('add repeating decimals', function () {
      const result = addCurrencies(1 / 3, 1 / 9)
      assert.equal(result.toNumber(), 0.4444444444444444)
    })
  })
})
