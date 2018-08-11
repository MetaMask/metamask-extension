const assert = require('assert')
const { sufficientBalance } = require('../../../app/scripts/lib/util')


describe('SufficientBalance', function () {
  it('returns true if max tx cost is equal to balance.', function () {
    const tx = {
      'value': '0x1',
      'gas': '0x2',
      'gasPrice': '0x3',
    }
    const balance = '0x8'

    const result = sufficientBalance(tx, balance)
    assert.ok(result, 'sufficient balance found.')
  })

  it('returns true if max tx cost is less than balance.', function () {
    const tx = {
      'value': '0x1',
      'gas': '0x2',
      'gasPrice': '0x3',
    }
    const balance = '0x9'

    const result = sufficientBalance(tx, balance)
    assert.ok(result, 'sufficient balance found.')
  })

  it('returns false if max tx cost is more than balance.', function () {
    const tx = {
      'value': '0x1',
      'gas': '0x2',
      'gasPrice': '0x3',
    }
    const balance = '0x6'

    const result = sufficientBalance(tx, balance)
    assert.ok(!result, 'insufficient balance found.')
  })
})
