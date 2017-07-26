const assert = require('assert')
const Blacklister = require('../../app/scripts/blacklister')


describe('blacklister', function () {
  describe('#isPhish', function () {
    it('should not flag whitelisted values', function () {
      var result = Blacklister('www.metamask.io')
      assert(!result)
    })
    it('should flag explicit values', function () {
      var result = Blacklister('metamask.com')
      assert(result)
    })
    it('should flag levenshtein values', function () {
      var result = Blacklister('metmask.io')
      assert(result)
    })
    it('should not flag not-even-close values', function () {
      var result = Blacklister('example.com')
      assert(!result)
    })
  })
})
