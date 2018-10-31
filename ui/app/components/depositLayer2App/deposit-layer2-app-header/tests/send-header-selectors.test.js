import assert from 'assert'
import proxyquire from 'proxyquire'

const {
  getTitleKey,
  getSubtitleParams,
} = proxyquire('../send-header.selectors', {
  '../send.selectors': {
    getSelectedToken: (mockState) => mockState.t,
    getSendEditingTransactionId: (mockState) => mockState.e,
  },
})

describe('send-header selectors', () => {

  describe('getTitleKey()', () => {
    it('should return the correct key when getSendEditingTransactionId is truthy', () => {
      assert.equal(getTitleKey({ e: 1, t: true }), 'edit')
    })

    it('should return the correct key when getSendEditingTransactionId is falsy and getSelectedToken is truthy', () => {
      assert.equal(getTitleKey({ e: null, t: 'abc' }), 'sendTokens')
    })

    it('should return the correct key when getSendEditingTransactionId is falsy and getSelectedToken is falsy', () => {
      assert.equal(getTitleKey({ e: null }), 'sendETH')
    })
  })

  describe('getSubtitleParams()', () => {
    it('should return the correct params when getSendEditingTransactionId is truthy', () => {
      assert.deepEqual(getSubtitleParams({ e: 1, t: true }), [ 'editingTransaction' ])
    })

    it('should return the correct params when getSendEditingTransactionId is falsy and getSelectedToken is truthy', () => {
      assert.deepEqual(
        getSubtitleParams({ e: null, t: { symbol: 'ABC' } }),
        [ 'onlySendTokensToAccountAddress', [ 'ABC' ] ]
      )
    })

    it('should return the correct params when getSendEditingTransactionId is falsy and getSelectedToken is falsy', () => {
      assert.deepEqual(getSubtitleParams({ e: null }), [ 'onlySendToEtherAddress' ])
    })
  })

})
