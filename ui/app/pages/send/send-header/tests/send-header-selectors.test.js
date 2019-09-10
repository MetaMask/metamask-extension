import assert from 'assert'
import proxyquire from 'proxyquire'

const {
  getTitleKey,
  getSubtitleParams,
} = proxyquire('../send-header.selectors', {
  '../send.selectors': {
    getSelectedToken: (mockState) => mockState.t,
    getSendEditingTransactionId: (mockState) => mockState.e,
    getSendTo: (mockState) => mockState.to,
  },
})

describe('send-header selectors', () => {

  describe('getTitleKey()', () => {
    it('should return the correct key when "to" is empty', () => {
      assert.equal(getTitleKey({ e: 1, t: true, to: '' }), 'addRecipient')
    })

    it('should return the correct key when getSendEditingTransactionId is truthy', () => {
      assert.equal(getTitleKey({ e: 1, t: true, to: '0x123' }), 'edit')
    })

    it('should return the correct key when getSendEditingTransactionId is falsy and getSelectedToken is truthy', () => {
      assert.equal(getTitleKey({ e: null, t: 'abc', to: '0x123' }), 'sendTokens')
    })

    it('should return the correct key when getSendEditingTransactionId is falsy and getSelectedToken is falsy', () => {
      assert.equal(getTitleKey({ e: null, to: '0x123' }), 'sendETH')
    })
  })

  describe('getSubtitleParams()', () => {
    it('should return the correct params when getSendEditingTransactionId is truthy', () => {
      assert.deepEqual(getSubtitleParams({ e: 1, t: true, to: '0x123' }), [ 'editingTransaction' ])
    })

    it('should return the correct params when getSendEditingTransactionId is falsy and getSelectedToken is truthy', () => {
      assert.deepEqual(
        getSubtitleParams({ e: null, t: { symbol: 'ABC' }, to: '0x123' }),
        [ 'onlySendTokensToAccountAddress', [ 'ABC' ] ]
      )
    })

    it('should return the correct params when getSendEditingTransactionId is falsy and getSelectedToken is falsy', () => {
      assert.deepEqual(getSubtitleParams({ e: null, to: '0x123' }), [ 'onlySendToEtherAddress' ])
    })
  })

})
