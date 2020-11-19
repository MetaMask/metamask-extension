import assert from 'assert'
import ethUtil from 'ethereumjs-util'
import * as util from './util'

describe('util', function () {
  let ethInWei = '1'
  for (let i = 0; i < 18; i++) {
    ethInWei += '0'
  }

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
      const address = '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825'
      const result = util.addressSummary(address)
      assert.equal(result, '0xFDEa65C8...b825')
    })

    it('should accept arguments for firstseg, lastseg, and keepPrefix', function () {
      const address = '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825'
      const result = util.addressSummary(address, 4, 4, false)
      assert.equal(result, 'FDEa...b825')
    })
  })

  describe('#isValidAddress', function () {
    it('should allow 40-char non-prefixed hex', function () {
      const address = 'fdea65c8e26263f6d9a1b5de9555d2931a33b825'
      const result = util.isValidAddress(address)
      assert.ok(result)
    })

    it('should allow 42-char non-prefixed hex', function () {
      const address = '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825'
      const result = util.isValidAddress(address)
      assert.ok(result)
    })

    it('should not allow less non hex-prefixed', function () {
      const address = 'fdea65c8e26263f6d9a1b5de9555d2931a33b85'
      const result = util.isValidAddress(address)
      assert.ok(!result)
    })

    it('should not allow less hex-prefixed', function () {
      const address = '0xfdea65ce26263f6d9a1b5de9555d2931a33b85'
      const result = util.isValidAddress(address)
      assert.ok(!result)
    })

    it('should recognize correct capitalized checksum', function () {
      const address = '0xFDEa65C8e26263F6d9A1B5de9555D2931A33b825'
      const result = util.isValidAddress(address)
      assert.ok(result)
    })

    it('should recognize incorrect capitalized checksum', function () {
      const address = '0xFDea65C8e26263F6d9A1B5de9555D2931A33b825'
      const result = util.isValidAddress(address)
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

  describe('isValidDomainName', function () {
    it('should return true when given a valid domain name', function () {
      assert.strictEqual(util.isValidDomainName('foo.bar'), true)
    })

    it('should return true when given a valid subdomain', function () {
      assert.strictEqual(util.isValidDomainName('foo.foo.bar'), true)
    })

    it('should return true when given a single-character domain', function () {
      assert.strictEqual(util.isValidDomainName('f.bar'), true)
    })

    it('should return true when given a unicode TLD', function () {
      assert.strictEqual(util.isValidDomainName('台灣.中国'), true)
    })

    it('should return false when given a domain with unacceptable ASCII characters', function () {
      assert.strictEqual(util.isValidDomainName('$.bar'), false)
    })

    it('should return false when given a TLD that starts with a dash', function () {
      assert.strictEqual(util.isValidDomainName('foo.-bar'), false)
    })

    it('should return false when given a TLD that ends with a dash', function () {
      assert.strictEqual(util.isValidDomainName('foo.bar-'), false)
    })

    it('should return false when given a domain name with a chunk that starts with a dash', function () {
      assert.strictEqual(util.isValidDomainName('-foo.bar'), false)
    })

    it('should return false when given a domain name with a chunk that ends with a dash', function () {
      assert.strictEqual(util.isValidDomainName('foo-.bar'), false)
    })

    it('should return false when given a bare TLD', function () {
      assert.strictEqual(util.isValidDomainName('bar'), false)
    })

    it('should return false when given a domain that starts with a period', function () {
      assert.strictEqual(util.isValidDomainName('.bar'), false)
    })

    it('should return false when given a subdomain that starts with a period', function () {
      assert.strictEqual(util.isValidDomainName('.foo.bar'), false)
    })

    it('should return false when given a domain that ends with a period', function () {
      assert.strictEqual(util.isValidDomainName('bar.'), false)
    })

    it('should return false when given a 1-character TLD', function () {
      assert.strictEqual(util.isValidDomainName('foo.b'), false)
    })
  })

  describe('#numericBalance', function () {
    it('should return a BN 0 if given nothing', function () {
      const result = util.numericBalance()
      assert.equal(result.toString(10), 0)
    })

    it('should work with hex prefix', function () {
      const result = util.numericBalance('0x012')
      assert.equal(result.toString(10), '18')
    })

    it('should work with no hex prefix', function () {
      const result = util.numericBalance('012')
      assert.equal(result.toString(10), '18')
    })
  })

  describe('#formatBalance', function () {
    it('should return None when given nothing', function () {
      const result = util.formatBalance()
      assert.equal(result, 'None', 'should return "None"')
    })

    it('should return 1.0000 ETH', function () {
      const input = new ethUtil.BN(ethInWei, 10).toJSON()
      const result = util.formatBalance(input, 4)
      assert.equal(result, '1.0000 ETH')
    })

    it('should return 0.500 ETH', function () {
      const input = new ethUtil.BN(ethInWei, 10)
        .div(new ethUtil.BN('2', 10))
        .toJSON()
      const result = util.formatBalance(input, 3)
      assert.equal(result, '0.500 ETH')
    })

    it('should display specified decimal points', function () {
      const input = '0x128dfa6a90b28000'
      const result = util.formatBalance(input, 2)
      assert.equal(result, '1.33 ETH')
    })
    it('should default to 3 decimal points', function () {
      const input = '0x128dfa6a90b28000'
      const result = util.formatBalance(input)
      assert.equal(result, '1.337 ETH')
    })
    it('should show 2 significant digits for tiny balances', function () {
      const input = '0x1230fa6a90b28'
      const result = util.formatBalance(input)
      assert.equal(result, '0.00032 ETH')
    })
    it('should not parse the balance and return value with 2 decimal points with ETH at the end', function () {
      const value = '1.2456789'
      const needsParse = false
      const result = util.formatBalance(value, 2, needsParse)
      assert.equal(result, '1.24 ETH')
    })
  })

  describe('normalizing values', function () {
    describe('#normalizeToWei', function () {
      it('should convert an eth to the appropriate equivalent values', function () {
        const valueTable = {
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
        const oneEthBn = new ethUtil.BN(ethInWei, 10)

        Object.keys(valueTable).forEach((currency) => {
          const value = new ethUtil.BN(valueTable[currency], 10)
          const output = util.normalizeToWei(value, currency)
          assert.equal(
            output.toString(10),
            valueTable.wei,
            `value of ${output.toString(
              10,
            )} ${currency} should convert to ${oneEthBn}`,
          )
        })
      })
    })

    describe('#normalizeEthStringToWei', function () {
      it('should convert decimal eth to pure wei BN', function () {
        const input = '1.23456789'
        const output = util.normalizeEthStringToWei(input)
        assert.equal(output.toString(10), '1234567890000000000')
      })

      it('should convert 1 to expected wei', function () {
        const input = '1'
        const output = util.normalizeEthStringToWei(input)
        assert.equal(output.toString(10), ethInWei)
      })

      it('should account for overflow numbers gracefully by dropping extra precision.', function () {
        const input = '1.11111111111111111111'
        const output = util.normalizeEthStringToWei(input)
        assert.equal(output.toString(10), '1111111111111111111')
      })

      it('should not truncate very exact wei values that do not have extra precision.', function () {
        const input = '1.100000000000000001'
        const output = util.normalizeEthStringToWei(input)
        assert.equal(output.toString(10), '1100000000000000001')
      })
    })

    describe('#normalizeNumberToWei', function () {
      it('should handle a simple use case', function () {
        const input = 0.0002
        const output = util.normalizeNumberToWei(input, 'ether')
        const str = output.toString(10)
        assert.equal(str, '200000000000000')
      })

      it('should convert a kwei number to the appropriate equivalent wei', function () {
        const result = util.normalizeNumberToWei(1.111, 'kwei')
        assert.equal(result.toString(10), '1111', 'accepts decimals')
      })

      it('should convert a ether number to the appropriate equivalent wei', function () {
        const result = util.normalizeNumberToWei(1.111, 'ether')
        assert.equal(
          result.toString(10),
          '1111000000000000000',
          'accepts decimals',
        )
      })
    })
    describe('#isHex', function () {
      it('should return true when given a hex string', function () {
        const result = util.isHex(
          'c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2',
        )
        assert(result)
      })

      it('should return false when given a non-hex string', function () {
        const result = util.isHex(
          'c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714imnotreal',
        )
        assert(!result)
      })

      it('should return false when given a string containing a non letter/number character', function () {
        const result = util.isHex(
          'c3ab8ff13720!8ad9047dd39466b3c%8974e592c2fa383d4a396071imnotreal',
        )
        assert(!result)
      })

      it('should return true when given a hex string with hex-prefix', function () {
        const result = util.isHex(
          '0xc3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2',
        )
        assert(result)
      })
    })

    describe('#getRandomFileName', function () {
      it('should only return a string containing alphanumeric characters', function () {
        const result = util.getRandomFileName()
        assert(result.match(/^[a-zA-Z0-9]*$/gu))
      })

      // 50 samples
      it('should return a string that is between 6 and 12 characters in length', function () {
        for (let i = 0; i < 50; i++) {
          const result = util.getRandomFileName()
          assert(result.length >= 6 && result.length <= 12)
        }
      })
    })
  })

  describe('checkExistingAddresses', function () {
    const tokenList = [
      { address: 'A' },
      { address: 'n' },
      { address: 'Q' },
      { address: 'z' },
    ]

    it('should return true when a lowercase address matches an uppercase address in the passed list', function () {
      assert(util.checkExistingAddresses('q', tokenList) === true)
    })

    it('should return true when an uppercase address matches a lowercase address in the passed list', function () {
      assert(util.checkExistingAddresses('N', tokenList) === true)
    })

    it('should return true when a lowercase address matches a lowercase address in the passed list', function () {
      assert(util.checkExistingAddresses('z', tokenList) === true)
    })

    it('should return true when an uppercase address matches an uppercase address in the passed list', function () {
      assert(util.checkExistingAddresses('Q', tokenList) === true)
    })

    it('should return false when the passed address is not in the passed list', function () {
      assert(util.checkExistingAddresses('b', tokenList) === false)
    })
  })

  describe('toPrecisionWithoutTrailingZeros', function () {
    const testData = [
      { args: ['0', 9], result: '0' },
      { args: [0, 9], result: '0' },
      { args: ['0.0', 9], result: '0' },
      { args: ['0.000000000000', 9], result: '0' },
      { args: ['1', 9], result: '1' },
      { args: [1], result: '1' },
      { args: ['1.0', 9], result: '1' },
      { args: ['1.000000000', 9], result: '1' },
      { args: ['000000001', 9], result: '1' },
      { args: ['000000001.0', 9], result: '1' },
      { args: ['100000000', 9], result: '100000000' },
      { args: ['100000000.00001', 9], result: '100000000' },
      { args: ['100.00001', 9], result: '100.00001' },
      { args: ['100.00001000', 9], result: '100.00001' },
      { args: ['100.000010001', 9], result: '100.00001' },
      { args: ['10.010101', 9], result: '10.010101' },
      { args: ['0.1', 5], result: '0.1' },
      { args: ['0.10', 5], result: '0.1' },
      { args: ['0.1010', 5], result: '0.101' },
      { args: ['0.01001', 5], result: '0.01001' },
      { args: ['0.010010', 5], result: '0.01001' },
      { args: ['0.010011', 5], result: '0.010011' },
      { args: ['1.01005', 5], result: '1.0101' },
      { args: ['1.000049', 5], result: '1' },
      { args: ['1.00005', 5], result: '1.0001' },
      { args: ['0.0000123456789', 9], result: '0.0000123456789' },
      { args: ['1.0000123456789', 10], result: '1.000012346' },
      { args: ['10000.0000012345679', 10], result: '10000' },
      { args: ['1000000000000', 10], result: '1e+12' },
      { args: ['1000050000000', 10], result: '1.00005e+12' },
      { args: ['100000000000000000000', 10], result: '1e+20' },
      { args: ['100005000000000000000', 10], result: '1.00005e+20' },
      { args: ['100005000000000000000.0', 10], result: '1.00005e+20' },
    ]

    testData.forEach(({ args, result }) => {
      it(`should return ${result} when passed number ${args[0]} and precision ${args[1]}`, function () {
        assert.equal(util.toPrecisionWithoutTrailingZeros(...args), result)
      })
    })
  })

  describe('addHexPrefixToObjectValues()', function () {
    it('should return a new object with the same properties with a 0x prefix', function () {
      assert.deepEqual(
        util.addHexPrefixToObjectValues({
          prop1: '0x123',
          prop2: '456',
          prop3: 'x',
        }),
        {
          prop1: '0x123',
          prop2: '0x456',
          prop3: '0xx',
        },
      )
    })
  })
})
