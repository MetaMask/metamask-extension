const assert = require('assert')
const sinon = require('sinon')

const path = require('path')
const IconFactoryGen = require(path.join(__dirname, '..', '..', '..', 'ui', 'lib', 'icon-factory.js'))

describe('icon-factory', function() {
  let iconFactory, address, diameter

  beforeEach(function() {
    iconFactory = IconFactoryGen((d,n) => 'stubicon')
    address = '0x012345671234567890'
    diameter = 50
  })

  it('should return a data-uri string for any address and diameter', function() {
    const output = iconFactory.iconForAddress(address, diameter)
    assert.ok(output.indexOf('data:image/svg') === 0)
    assert.equal(output, iconFactory.cache[address][diameter])
  })

  it('should default to cache first', function() {
    const testOutput = 'foo'
    const mockSizeCache = {}
    mockSizeCache[diameter] = testOutput
    iconFactory.cache[address] = mockSizeCache

    const output = iconFactory.iconForAddress(address, diameter)
    assert.equal(output, testOutput)
  })
})
