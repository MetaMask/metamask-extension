const assert = require('assert')
const { sufficientBalance, capitalizeFirstLetter } = require('../../../app/scripts/lib/util')


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

describe('capitalizeFirstLetter', () => {
  it('returns correct output with capitalized first letter of the first word', () => {
    assert.equal('T', capitalizeFirstLetter('t'))
    assert.equal('Test', capitalizeFirstLetter('test'))
    assert.equal('Test with multiple words', capitalizeFirstLetter('test with multiple words'))
    assert.equal('Test with multiple words', capitalizeFirstLetter('Test with multiple words'))
    assert.equal('', capitalizeFirstLetter(''))
    assert.equal('', capitalizeFirstLetter())
  })
})
