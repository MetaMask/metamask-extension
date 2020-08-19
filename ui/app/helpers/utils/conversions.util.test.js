import assert from 'assert'
import * as utils from './conversions.util'

describe('decETHToDecWEI', function () {
  it('should correctly convert 1 ETH to WEI', function () {
    const weiValue = utils.decETHToDecWEI('1')
    assert.equal(weiValue, '1000000000000000000')
  })

  it('should correctly convert 0.000000000000000001 ETH to WEI', function () {
    const weiValue = utils.decETHToDecWEI('0.000000000000000001')
    assert.equal(weiValue, '1')
  })

  it('should correctly convert 1000000.000000000000000001 ETH to WEI', function () {
    const weiValue = utils.decETHToDecWEI('1000000.000000000000000001')
    assert.equal(weiValue, '1000000000000000000000001')
  })

  it('should correctly convert 9876.543210 ETH to WEI', function () {
    const weiValue = utils.decETHToDecWEI('9876.543210')
    assert.equal(weiValue, '9876543210000000000000')
  })

  it('should correctly convert 1.0000000000000000 ETH to WEI', function () {
    const weiValue = utils.decETHToDecWEI('1.0000000000000000')
    assert.equal(weiValue, '1000000000000000000')
  })
})
