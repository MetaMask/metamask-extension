const assert = require('assert')
const { countSignificantDecimals } = require('../../../../old-ui/app/util')

describe('countSignificantDecimals(val, len) function', () => {
  it('returns correct significant decimals', () => {
    assert.equal(6, countSignificantDecimals(0.00001232756347, 2))
    assert.equal(4, countSignificantDecimals(0.00010000003454305430504350, 2))
    assert.equal(0, countSignificantDecimals(1.0000, 2))
    assert.equal(0, countSignificantDecimals(2, 2))
    assert.equal(3, countSignificantDecimals('2.03243', 2))
  })
})
