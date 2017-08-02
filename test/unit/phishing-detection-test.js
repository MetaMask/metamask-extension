const assert = require('assert')
const isPhish = require('../../app/scripts/lib/is-phish')

describe('phishing detection test', function () {
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
    it('should not flag the ropsten faucet domains', function () {
      var result = isPhish({ hostname: 'faucet.metamask.io' })
      assert.equal(result, false)
    })
    it('should not flag the mascara domain', function () {
      var result = isPhish({ hostname: 'zero.metamask.io' })
      assert.equal(result, false)
    })
    it('should not flag the mascara-faucet domain', function () {
      var result = isPhish({ hostname: 'zero-faucet.metamask.io' })
      assert.equal(result, false)
    })
  })
})

