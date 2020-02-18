import assert from 'assert'
import proxyquire from 'proxyquire'

const {
  getTitleKey,
} = proxyquire('../send-header.selectors', {
  '../send.selectors': {
    getSelectedToken: (mockState) => mockState.t,
    getSendEditingTransactionId: (mockState) => mockState.e,
    getSendTo: (mockState) => mockState.to,
  },
})

describe('send-header selectors', function () {

  describe('getTitleKey()', function () {
    it('should return the correct key when "to" is empty', function () {
      assert.equal(getTitleKey({ e: 1, t: true, to: '' }), 'addRecipient')
    })

    it('should return the correct key when getSendEditingTransactionId is truthy', function () {
      assert.equal(getTitleKey({ e: 1, t: true, to: '0x123' }), 'edit')
    })

    it('should return the correct key when getSendEditingTransactionId is falsy and getSelectedToken is truthy', function () {
      assert.equal(getTitleKey({ e: null, t: 'abc', to: '0x123' }), 'sendTokens')
    })

    it('should return the correct key when getSendEditingTransactionId is falsy and getSelectedToken is falsy', function () {
      assert.equal(getTitleKey({ e: null, to: '0x123' }), 'sendETH')
    })
  })

})
