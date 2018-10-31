import assert from 'assert'
import proxyquire from 'proxyquire'

const {
  isSendFormInError,
} = proxyquire('../send-footer.selectors', {
  '../send.selectors': {
    getSendErrors: (mockState) => mockState.errors,
  },
})

describe('send-footer selectors', () => {

  describe('getTitleKey()', () => {
    it('should return true if any of the values of the object returned by getSendErrors are truthy', () => {
      assert.equal(isSendFormInError({ errors: { a: 'abc', b: false} }), true)
    })

    it('should return false if all of the values of the object returned by getSendErrors are falsy', () => {
      assert.equal(isSendFormInError({ errors: { a: false, b: null} }), false)
    })
  })

})
