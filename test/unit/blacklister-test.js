const assert = require('assert')
const isPhish = require('../../app/scripts/lib/is-phish')

describe('blacklister', function () {
  describe('#isPhish', function () {
    it('should not flag whitelisted values', function () {
      var result = isPhish({ hostname: 'www.metamask.io' })
      assert(!result)
    })
    it('should flag explicit values', function () {
      var result = isPhish({ hostname: 'metamask.com' })
      assert(result)
    })
    it('should flag levenshtein values', function () {
      var result = isPhish({ hostname: 'metmask.com' })
      assert(result)
    })
    it('should not flag not-even-close values', function () {
      var result = isPhish({ hostname: 'example.com' })
      assert(!result)
    })
  })
})

