const assert = require('assert')
const isPhish = require('../../app/scripts/lib/is-phish')

describe('blacklister', function () {
  describe('#isPhish', function () {
    it('should not flag whitelisted values', function () {
      var result = isPhish({ hostname: 'www.metamask.io' })
      assert.equal(result, false)
    })
    it('should flag explicit values', function () {
      var result = isPhish({ hostname: 'metamask.com' })
      assert.equal(result, true)
    })
    it('should flag levenshtein values', function () {
      var result = isPhish({ hostname: 'metmask.io' })
      assert.equal(result, true)
    })
    it('should not flag not-even-close values', function () {
      var result = isPhish({ hostname: 'example.com' })
      assert.equal(result, false)
    })
  })
})

