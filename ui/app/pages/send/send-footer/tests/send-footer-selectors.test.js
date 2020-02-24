import assert from 'assert'
import proxyquire from 'proxyquire'

const {
  isSendFormInError,
} = proxyquire('../send-footer.selectors', {
  '../send.selectors': {
    getSendErrors: (mockState) => mockState.errors,
  },
})

describe('send-footer selectors', function () {

  describe('getTitleKey()', function () {
    it('should return true if any of the values of the object returned by getSendErrors are truthy', function () {
      assert.equal(isSendFormInError({ errors: { a: 'abc', b: false } }), true)
    })

    it('should return false if all of the values of the object returned by getSendErrors are falsy', function () {
      assert.equal(isSendFormInError({ errors: { a: false, b: null } }), false)
    })
  })

})
