var assert = require('assert')
var sinon = require('sinon')
const ethUtil = require('ethereumjs-util')

var path = require('path')
var util = require(path.join(__dirname, '..', '..', 'ui', 'app', 'util.js'))

describe('util', function() {
  var ethInWei = '1'
  for (var i = 0; i < 18; i++ ) { ethInWei += '0' }

  beforeEach(function() {
    this.sinon = sinon.sandbox.create()
  })

  afterEach(function() {
    this.sinon.restore()
  })

  describe('addressSummary', function() {
    it('should add case-sensitive checksum', function() {
      var address = '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825'
      var result = util.addressSummary(address)
      assert.equal(result, '0xFDEa65C8...b825')
    })
  })

  describe('isValidAddress', function() {
    it('should allow 40-char non-prefixed hex', function() {
      var address = 'fdea65c8e26263f6d9a1b5de9555d2931a33b825'
      var result = util.isValidAddress(address)
      assert.ok(result)
    })

    it('should allow 42-char non-prefixed hex', function() {
      var address = '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825'
      var result = util.isValidAddress(address)
      assert.ok(result)
    })

    it('should not allow less non hex-prefixed', function() {
      var address = 'fdea65c8e26263f6d9a1b5de9555d2931a33b85'
      var result = util.isValidAddress(address)
      assert.ok(!result)
    })

    it('should not allow less hex-prefixed', function() {
      var address = '0xfdea65ce26263f6d9a1b5de9555d2931a33b85'
      var result = util.isValidAddress(address)
      assert.ok(!result)
    })

    it('should recognize correct capitalized checksum', function() {
      var address = '0xFDEa65C8e26263F6d9A1B5de9555D2931A33b825'
      var result = util.isValidAddress(address)
      assert.ok(result)
    })

    it('should recognize incorrect capitalized checksum', function() {
      var address = '0xFDea65C8e26263F6d9A1B5de9555D2931A33b825'
      var result = util.isValidAddress(address)
      assert.ok(!result)
    })

  })

  describe('numericBalance', function() {

    it('should return a BN 0 if given nothing', function() {
      var result = util.numericBalance()
      assert.equal(result.toString(10), 0)
    })

    it('should work with hex prefix', function() {
      var result = util.numericBalance('0x012')
      assert.equal(result.toString(10), '18')
    })

    it('should work with no hex prefix', function() {
      var result = util.numericBalance('012')
      assert.equal(result.toString(10), '18')
    })

  })

  describe('#ethToWei', function() {

    it('should take an eth BN, returns wei BN', function() {
      var input = new ethUtil.BN(1, 10)
      var result = util.ethToWei(input)
      assert.equal(result, ethInWei, '18 zeroes')
    })

  })

  describe('#weiToEth', function() {

    it('should take a wei BN and return an eth BN', function() {
    var result = util.weiToEth(new ethUtil.BN(ethInWei))
    assert.equal(result, '1', 'equals 1 eth')
    })

  })

  describe('#formatBalance', function() {

    it('when given nothing', function() {
      var result = util.formatBalance()
      assert.equal(result, 'None', 'should return "None"')
    })

    it('should return eth as string followed by ETH', function() {
      var input = new ethUtil.BN(ethInWei, 10).toJSON()
      var result = util.formatBalance(input)
      assert.equal(result, '1.0000 ETH')
    })

    it('should return eth as string followed by ETH', function() {
      var input = new ethUtil.BN(ethInWei, 10).div(new ethUtil.BN('2', 10)).toJSON()
      var result = util.formatBalance(input)
      assert.equal(result, '0.5000 ETH')
    })

    it('should display four decimal points', function() {
      var input = "0x128dfa6a90b28000"
      var result = util.formatBalance(input)
      assert.equal(result, '1.3370 ETH')
    })

  })

  describe('normalizing values', function() {

    describe('#normalizeToWei', function() {
      it('should convert an eth to the appropriate equivalent values', function() {
        var valueTable = {
          wei:   '1000000000000000000',
          kwei:  '1000000000000000',
          mwei:  '1000000000000',
          gwei:  '1000000000',
          szabo: '1000000',
          finney:'1000',
          ether: '1',
          // kether:'0.001',
          // mether:'0.000001',
          // AUDIT: We're getting BN numbers on these ones.
          // I think they're big enough to ignore for now.
          // gether:'0.000000001',
          // tether:'0.000000000001',
        }
        var oneEthBn = new ethUtil.BN(ethInWei, 10)

        for(var currency in valueTable) {

          var value = new ethUtil.BN(valueTable[currency], 10)
          var output = util.normalizeToWei(value, currency)
          assert.equal(output.toString(10), valueTable.wei, `value of ${output.toString(10)} ${currency} should convert to ${oneEthBn}`)
        }
      })
    })

    describe('#normalizeNumberToWei', function() {

      it('should handle a simple use case', function() {
        var input = 0.0002
        var output = util.normalizeNumberToWei(input, 'ether')
        var str = output.toString(10)
        assert.equal(str, '200000000000000')
      })

      it('should convert a kwei number to the appropriate equivalent wei', function() {
        var result = util.normalizeNumberToWei(1.111, 'kwei')
        assert.equal(result.toString(10), '1111', 'accepts decimals')
      })

      it('should convert a ether number to the appropriate equivalent wei', function() {
        var result = util.normalizeNumberToWei(1.111, 'ether')
        assert.equal(result.toString(10), '1111000000000000000', 'accepts decimals')
      })
    })
  })
})
