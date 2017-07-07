var assert = require('assert')
var BinaryRenderer = require('../../../ui/classic/app/components/binary-renderer')

describe('BinaryRenderer', function () {
  let binaryRenderer
  const message = 'Hello, world!'
  const buffer = new Buffer(message, 'utf8')
  const hex = buffer.toString('hex')

  beforeEach(function () {
    binaryRenderer = new BinaryRenderer()
  })

  it('recovers message', function () {
    const result = binaryRenderer.hexToText(hex)
    assert.equal(result, message)
  })

  it('recovers message with hex prefix', function () {
    const result = binaryRenderer.hexToText('0x' + hex)
    assert.equal(result, message)
  })
})
