import assert from 'assert'
import {addCurrencies} from './conversion-util'



describe('conversion utils', () => {
  describe('addCurrencies()', () => {
    it('add whole numbers', () => {
      const result = addCurrencies(3, 5)
      assert.equal(result.toNumber(), 8)
    })

    it('add decimals', () => {
      const result = addCurrencies(1.3, 1.5)
      assert.equal(result.toNumber(), 2.8)
    })

    it('add repeating decimals', () => {
      const result = addCurrencies(1/3, 1/7)
      assert.equal(result.toNumber(), 0.47619047619047616)
    })
  })
})
