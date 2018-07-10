import assert from 'assert'
import { removeLeadingZeroes } from './send.utils'


describe('send utils', () => {
  describe('removeLeadingZeroes()', () => {
    it('should remove leading zeroes from int when user types', () => {
      assert.equal(removeLeadingZeroes('0'), '0')
      assert.equal(removeLeadingZeroes('1'), '1')
      assert.equal(removeLeadingZeroes('00'), '0')
      assert.equal(removeLeadingZeroes('01'), '1')
    })

    it('should remove leading zeroes from int when user copy/paste', () => {
      assert.equal(removeLeadingZeroes('001'), '1')
    })

    it('should remove leading zeroes from float when user types', () => {
      assert.equal(removeLeadingZeroes('0.'), '0.')
      assert.equal(removeLeadingZeroes('0.0'), '0.0')
      assert.equal(removeLeadingZeroes('0.00'), '0.00')
      assert.equal(removeLeadingZeroes('0.001'), '0.001')
      assert.equal(removeLeadingZeroes('0.10'), '0.10')
    })

    it('should remove leading zeroes from float when user copy/paste', () => {
      assert.equal(removeLeadingZeroes('00.1'), '0.1')
    })
  })
})
