var assert = require('assert')
var sinon = require('sinon')
const ethUtil = require('ethereumjs-util')

var path = require('path')
var util = require(path.join(__dirname, '..', '..', 'ui', 'app', 'helpers', 'utils', 'util.js'))

describe('util', function () {
  var ethInWei = '1'
  for (var i = 0; i < 18; i++) { ethInWei += '0' }

  beforeEach(function () {
    this.sinon = sinon.createSandbox()
  })

  afterEach(function () {
    this.sinon.restore()
  })

  describe('#parseBalance', function () {
    it('should render 0.01 eth correctly', function () {
      const input = '0x2386F26FC10000'
      const output = util.parseBalance(input)
      assert.deepEqual(output, ['0', '01'])
    })

    it('should render 12.023 eth correctly', function () {
      const input = 'A6DA46CCA6858000'
      const output = util.parseBalance(input)
      assert.deepEqual(output, ['12', '023'])
    })

    it('should render 0.0000000342422 eth correctly', function () {
      const input = '0x7F8FE81C0'
      const output = util.parseBalance(input)
      assert.deepEqual(output, ['0', '0000000342422'])
    })

    it('should render 0 eth correctly', function () {
      const input = '0x0'
      const output = util.parseBalance(input)
      assert.deepEqual(output, ['0', '0'])
    })
  })

  describe('#addressSummary', function () {
    it('should add case-sensitive checksum', function () {
      var address = '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825'
      var result = util.addressSummary(address)
      assert.equal(result, '0xFDEa65C8...b825')
    })

    it('should accept arguments for firstseg, lastseg, and keepPrefix', function () {
      var address = '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825'
      var result = util.addressSummary(address, 4, 4, false)
      assert.equal(result, 'FDEa...b825')
    })
  })

  describe('#isValidAddress', function () {
    it('should allow 40-char non-prefixed hex', function () {
      var address = 'fdea65c8e26263f6d9a1b5de9555d2931a33b825'
      var result = util.isValidAddress(address)
      assert.ok(result)
    })

    it('should allow 42-char non-prefixed hex', function () {
      var address = '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825'
      var result = util.isValidAddress(address)
      assert.ok(result)
    })

    it('should not allow less non hex-prefixed', function () {
      var address = 'fdea65c8e26263f6d9a1b5de9555d2931a33b85'
      var result = util.isValidAddress(address)
      assert.ok(!result)
    })

    it('should not allow less hex-prefixed', function () {
      var address = '0xfdea65ce26263f6d9a1b5de9555d2931a33b85'
      var result = util.isValidAddress(address)
      assert.ok(!result)
    })

    it('should recognize correct capitalized checksum', function () {
      var address = '0xFDEa65C8e26263F6d9A1B5de9555D2931A33b825'
      var result = util.isValidAddress(address)
      assert.ok(result)
    })

    it('should recognize incorrect capitalized checksum', function () {
      var address = '0xFDea65C8e26263F6d9A1B5de9555D2931A33b825'
      var result = util.isValidAddress(address)
      assert.ok(!result)
    })

    it('should recognize this sample hashed address', function () {
      const address = '0x5Fda30Bb72B8Dfe20e48A00dFc108d0915BE9Bb0'
      const result = util.isValidAddress(address)
      const hashed = ethUtil.toChecksumAddress(address.toLowerCase())
      assert.equal(hashed, address, 'example is hashed correctly')
      assert.ok(result, 'is valid by our check')
    })
  })

  describe('#numericBalance', function () {
    it('should return a BN 0 if given nothing', function () {
      var result = util.numericBalance()
      assert.equal(result.toString(10), 0)
    })

    it('should work with hex prefix', function () {
      var result = util.numericBalance('0x012')
      assert.equal(result.toString(10), '18')
    })

    it('should work with no hex prefix', function () {
      var result = util.numericBalance('012')
      assert.equal(result.toString(10), '18')
    })
  })

  describe('#formatBalance', function () {
    it('when given nothing', function () {
      var result = util.formatBalance()
      assert.equal(result, 'None', 'should return "None"')
    })

    it('should return eth as string followed by ETH', function () {
      var input = new ethUtil.BN(ethInWei, 10).toJSON()
      var result = util.formatBalance(input, 4)
      assert.equal(result, '1.0000 ETH')
    })

    it('should return eth as string followed by ETH', function () {
      var input = new ethUtil.BN(ethInWei, 10).div(new ethUtil.BN('2', 10)).toJSON()
      var result = util.formatBalance(input, 3)
      assert.equal(result, '0.500 ETH')
    })

    it('should display specified decimal points', function () {
      var input = '0x128dfa6a90b28000'
      var result = util.formatBalance(input, 2)
      assert.equal(result, '1.33 ETH')
    })
    it('should default to 3 decimal points', function () {
      var input = '0x128dfa6a90b28000'
      var result = util.formatBalance(input)
      assert.equal(result, '1.337 ETH')
    })
    it('should show 2 significant digits for tiny balances', function () {
      var input = '0x1230fa6a90b28'
      var result = util.formatBalance(input)
      assert.equal(result, '0.00032 ETH')
    })
    it('should not parse the balance and return value with 2 decimal points with ETH at the end', function () {
      var value = '1.2456789'
      var needsParse = false
      var result = util.formatBalance(value, 2, needsParse)
      assert.equal(result, '1.24 ETH')
    })
  })

  describe('normalizing values', function () {
    describe('#normalizeToWei', function () {
      it('should convert an eth to the appropriate equivalent values', function () {
        var valueTable = {
          wei: '1000000000000000000',
          kwei: '1000000000000000',
          mwei: '1000000000000',
          gwei: '1000000000',
          szabo: '1000000',
          finney: '1000',
          ether: '1',
          // kether:'0.001',
          // mether:'0.000001',
          // AUDIT: We're getting BN numbers on these ones.
          // I think they're big enough to ignore for now.
          // gether:'0.000000001',
          // tether:'0.000000000001',
        }
        var oneEthBn = new ethUtil.BN(ethInWei, 10)

        for (var currency in valueTable) {
          var value = new ethUtil.BN(valueTable[currency], 10)
          var output = util.normalizeToWei(value, currency)
          assert.equal(output.toString(10), valueTable.wei, `value of ${output.toString(10)} ${currency} should convert to ${oneEthBn}`)
        }
      })
    })

    describe('#normalizeEthStringToWei', function () {
      it('should convert decimal eth to pure wei BN', function () {
        var input = '1.23456789'
        var output = util.normalizeEthStringToWei(input)
        assert.equal(output.toString(10), '1234567890000000000')
      })

      it('should convert 1 to expected wei', function () {
        var input = '1'
        var output = util.normalizeEthStringToWei(input)
        assert.equal(output.toString(10), ethInWei)
      })

      it('should account for overflow numbers gracefully by dropping extra precision.', function () {
        var input = '1.11111111111111111111'
        var output = util.normalizeEthStringToWei(input)
        assert.equal(output.toString(10), '1111111111111111111')
      })

      it('should not truncate very exact wei values that do not have extra precision.', function () {
        var input = '1.100000000000000001'
        var output = util.normalizeEthStringToWei(input)
        assert.equal(output.toString(10), '1100000000000000001')
      })
    })

    describe('#normalizeNumberToWei', function () {
      it('should handle a simple use case', function () {
        var input = 0.0002
        var output = util.normalizeNumberToWei(input, 'ether')
        var str = output.toString(10)
        assert.equal(str, '200000000000000')
      })

      it('should convert a kwei number to the appropriate equivalent wei', function () {
        var result = util.normalizeNumberToWei(1.111, 'kwei')
        assert.equal(result.toString(10), '1111', 'accepts decimals')
      })

      it('should convert a ether number to the appropriate equivalent wei', function () {
        var result = util.normalizeNumberToWei(1.111, 'ether')
        assert.equal(result.toString(10), '1111000000000000000', 'accepts decimals')
      })
    })
    describe('#isHex', function () {
      it('should return true when given a hex string', function () {
        var result = util.isHex('c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2')
        assert(result)
      })

      it('should return false when given a non-hex string', function () {
        var result = util.isHex('c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714imnotreal')
        assert(!result)
      })

      it('should return false when given a string containing a non letter/number character', function () {
        var result = util.isHex('c3ab8ff13720!8ad9047dd39466b3c%8974e592c2fa383d4a396071imnotreal')
        assert(!result)
      })

      it('should return true when given a hex string with hex-prefix', function () {
        var result = util.isHex('0xc3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2')
        assert(result)
      })
    })
  })
})
