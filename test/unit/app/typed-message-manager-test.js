const assert = require('assert')
const TypedMessageManager = require('../../../app/scripts/lib/typed-message-manager')

describe('Typed Message Manager', function () {

  const validData = '{"types":{"foo":[]},"message":{},"primaryType":"foo","domain":{}}'
  const invalidData = '{"types":{"foo":[]},"message":{},"primaryType":"foo"}'
  const address = '0x0d0c7188d9c72b019a5da9bca0d127680c22e659'
  let messageManager

  const validMessage = {
    'from': address,
    'data': validData,
  }
  const invalidMessage = {
    'data': validData,
  }
  const invalidDataMessage = {
    'data': invalidData,
    'from': address,
  }

  beforeEach(function () {
    messageManager = new TypedMessageManager()
  })

describe('#testing for typed messages', function () {

    it('should not throw in validateParams', function () {
      messageManager.validateParams(validMessage)
    })

    it('should not throw and the message should be unapproved', function () {
      messageManager.addUnapprovedMessage(validMessage)
      var result = messageManager.messages
      assert.equal(result[0].status, 'unapproved')
    })

    it('should throw in validateParams, missing from field', function () {
      try {
        messageManager.validateParams(invalidMessage)
      } catch (e) {
        assert.equal(e.message, 'Params must include a from field.')
      }
    })

    it('should throw due to missing domain data in params', function () {
      try {
      messageManager.addUnapprovedMessage(invalidDataMessage)
      } catch (e) {
        assert.equal(e.message, 'Data must conform to EIP-712 schema. See https://git.io/fNtcx.')
      }
    })
  })
})
