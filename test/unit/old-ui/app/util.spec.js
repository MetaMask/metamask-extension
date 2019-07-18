const assert = require('assert')
const {
  countSignificantDecimals,
  getCurrentKeyring,
  ifLooseAcc,
  ifContractAcc,
  addressSummary,
  isValidAddress,
  numericBalance,
  parseBalance,
  formatBalance,
  normalizeToWei,
  normalizeEthStringToWei,
  normalizeNumberToWei,
  isHex,
  ifRSK,
  ifRSKByProviderType,
  ifPOA,
  toChecksumAddress,
  isValidChecksumAddress,
  isInfuraProvider,
  isKnownProvider,
} = require('../../../../old-ui/app/util')
const ethUtil = require('ethereumjs-util')
let ethInWei = '1'
for (let i = 0; i < 18; i++) { ethInWei += '0' }

describe('countSignificantDecimals(val, len) function', () => {
  it('returns correct significant decimals', () => {
    assert.equal(6, countSignificantDecimals(0.00001232756347, 2))
    assert.equal(4, countSignificantDecimals(0.00010000003454305430504350, 2))
    assert.equal(0, countSignificantDecimals(1.0000, 2))
    assert.equal(0, countSignificantDecimals(2, 2))
    assert.equal(3, countSignificantDecimals('2.03243', 2))
  })
})

const keyrings = [
  {
    'type': 'HD Key Tree',
    'accounts': [
       '0xb55e278d3e8ff77ec95749b51b526a236502b6fe',
       '0x99a22ce737b6a48f44cad6331432ce98693cad07',
       '0xa37bd195eebfc4ccd02529125b3e691fb6fe3a53',
    ],
  },
  {
    'type': 'Simple Address',
    'accounts': [
       '0x2aE8025dECA9d0d0f985eC6666174FdF6546CC85',
    ],
    'network': '1',
  },
]

describe('getCurrentKeyring(address, keyrings, network, identities) function', () => {
  const address = '0xb55e278d3e8ff77ec95749b51b526a236502b6fe'
  const identities = {
    '0x99a22ce737b6a48f44cad6331432ce98693cad07': {name: 'Account 1', address: '0x99a22ce737b6a48f44cad6331432ce98693cad07'},
    '0xb55e278d3e8ff77ec95749b51b526a236502b6fe': {name: 'Account 2', address: '0xb55e278d3e8ff77ec95749b51b526a236502b6fe'},
    '0xa37bd195eebfc4ccd02529125b3e691fb6fe3a53': {name: 'Account 3', address: '0xa37bd195eebfc4ccd02529125b3e691fb6fe3a53'},
  }
  it('returns keyring matched to address', () => {
    assert.deepEqual({
      'type': 'HD Key Tree',
      'accounts': [
         '0xb55e278d3e8ff77ec95749b51b526a236502b6fe',
         '0x99a22ce737b6a48f44cad6331432ce98693cad07',
         '0xa37bd195eebfc4ccd02529125b3e691fb6fe3a53',
      ],
   }, getCurrentKeyring(address, 1, keyrings, identities))
  })

  it('doesn\'t return keyring matched to address', () => {
    assert.deepEqual(null, getCurrentKeyring('0x9053a0Fe25fc45367d06B2e04528BDb4c1A03eaB', 1, keyrings, identities))
  })
})

describe('ifLooseAcc(keyring) function', () => {
  it('Checks if keyring is looseAcc', () => {
    assert.equal(false, ifLooseAcc(keyrings[0]))
    assert.equal(true, ifLooseAcc(keyrings[1]))
    assert.equal(null, ifLooseAcc())
    assert.equal(true, ifLooseAcc({}))
  })
})

describe('ifContractAcc(keyring) function', () => {
  it('Checks if keyring is contract', () => {
    assert.equal(false, ifContractAcc(keyrings[0]))
    assert.equal(true, ifContractAcc(keyrings[1]))
    assert.equal(null, ifContractAcc())
    assert.equal(false, ifContractAcc({}))
  })
})

describe('#addressSummary', function () {
  it('should add case-sensitive checksum', function () {
    const address = '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825'
    const result = addressSummary(1, address)
    assert.equal(result, '0xFDEa65C8...b825')
  })

  it('should accept arguments for firstseg, lastseg, and keepPrefix', function () {
    const address = '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825'
    const result = addressSummary(1, address, 4, 4, false)
    assert.equal(result, 'FDEa...b825')
  })
})

describe('#isValidAddress', function () {
  it('should allow 40-char non-prefixed hex', function () {
    const address = 'fdea65c8e26263f6d9a1b5de9555d2931a33b825'
    const result = isValidAddress(address)
    assert.ok(result)
  })

  it('should allow 42-char non-prefixed hex', function () {
    const address = '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825'
    const result = isValidAddress(address)
    assert.ok(result)
  })

  it('should not allow less non hex-prefixed', function () {
    const address = 'fdea65c8e26263f6d9a1b5de9555d2931a33b85'
    const result = isValidAddress(address)
    assert.ok(!result)
  })

  it('should not allow less hex-prefixed', function () {
    const address = '0xfdea65ce26263f6d9a1b5de9555d2931a33b85'
    const result = isValidAddress(address)
    assert.ok(!result)
  })

  it('should recognize correct capitalized checksum', function () {
    const address = '0xFDEa65C8e26263F6d9A1B5de9555D2931A33b825'
    const result = isValidAddress(address)
    assert.ok(result)
  })

  it('should recognize incorrect capitalized checksum', function () {
    const address = '0xFDea65C8e26263F6d9A1B5de9555D2931A33b825'
    const result = isValidAddress(address)
    assert.ok(!result)
  })

  it('should recognize this sample hashed address', function () {
    const address = '0x5Fda30Bb72B8Dfe20e48A00dFc108d0915BE9Bb0'
    const result = isValidAddress(address)
    const hashed = ethUtil.toChecksumAddress(address.toLowerCase())
    assert.equal(hashed, address, 'example is hashed correctly')
    assert.ok(result, 'is valid by our check')
  })
})

describe('#numericBalance', function () {
  it('should return a BN 0 if given nothing', function () {
    const result = numericBalance()
    assert.equal(result.toString(10), 0)
  })

  it('should work with hex prefix', function () {
    const result = numericBalance('0x012')
    assert.equal(result.toString(10), '18')
  })

  it('should work with no hex prefix', function () {
    const result = numericBalance('012')
    assert.equal(result.toString(10), '18')
  })
})

describe('#parseBalance', function () {
  it('should render 0.01 eth correctly', function () {
    const input = '0x2386F26FC10000'
    const output = parseBalance(input)
    assert.deepEqual(output, ['0', '01'])
  })

  it('should render 12.023 eth correctly', function () {
    const input = 'A6DA46CCA6858000'
    const output = parseBalance(input)
    assert.deepEqual(output, ['12', '023'])
  })

  it('should render 0.0000000342422 eth correctly', function () {
    const input = '0x7F8FE81C0'
    const output = parseBalance(input)
    assert.deepEqual(output, ['0', '0000000342422'])
  })

  it('should render 0 eth correctly', function () {
    const input = '0x0'
    const output = parseBalance(input)
    assert.deepEqual(output, ['0', '0'])
  })
})

describe('formatBalance function', function () {
  it('when given nothing', function () {
    const result = formatBalance()
    assert.equal(result, '0', 'should return "None"')
  })

  it('should return eth as string followed by ETH', function () {
    const input = new ethUtil.BN(ethInWei, 10).toJSON()
    console.log('input = ', input)
    const result = formatBalance(input, 4)
    assert.equal(result, '1.0000 ETH')
  })

  it('should return eth as string followed by ETH', function () {
    const input = new ethUtil.BN(ethInWei, 10).div(new ethUtil.BN('2', 10)).toJSON()
    console.log('input = ', input)
    const result = formatBalance(input, 3)
    assert.equal(result, '0.500 ETH')
  })

  it('should display specified decimal points', function () {
    const input = '0x128dfa6a90b28000'
    const result = formatBalance(input, 2)
    assert.equal(result, '1.33 ETH')
  })

  it('should default to 3 decimal points', function () {
    const input = '0x128dfa6a90b28000'
    const result = formatBalance(input)
    assert.equal(result, '1.337 ETH')
  })

  it('should show 2 significant digits for tiny balances', function () {
    const input = '0x1230fa6a90b28'
    const result = formatBalance(input)
    assert.equal(result, '0.00032 ETH')
  })

  it('should not parse the balance and return value with 2 decimal points with ETH at the end', function () {
    const value = '1.2456789'
    const needsParse = false
    const result = formatBalance(value, 2, needsParse)
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
        var output = normalizeToWei(value, currency)
        assert.equal(output.toString(10), valueTable.wei, `value of ${output.toString(10)} ${currency} should convert to ${oneEthBn}`)
      }
    })
  })

  describe('#normalizeEthStringToWei', function () {
    it('should convert decimal eth to pure wei BN', function () {
      var input = '1.23456789'
      var output = normalizeEthStringToWei(input)
      assert.equal(output.toString(10), '1234567890000000000')
    })

    it('should convert 1 to expected wei', function () {
      var input = '1'
      var output = normalizeEthStringToWei(input)
      assert.equal(output.toString(10), ethInWei)
    })

    it('should account for overflow numbers gracefully by dropping extra precision.', function () {
      var input = '1.11111111111111111111'
      var output = normalizeEthStringToWei(input)
      assert.equal(output.toString(10), '1111111111111111111')
    })

    it('should not truncate very exact wei values that do not have extra precision.', function () {
      var input = '1.100000000000000001'
      var output = normalizeEthStringToWei(input)
      assert.equal(output.toString(10), '1100000000000000001')
    })
  })

  describe('#normalizeNumberToWei', function () {
    it('should handle a simple use case', function () {
      var input = 0.0002
      var output = normalizeNumberToWei(input, 'ether')
      var str = output.toString(10)
      assert.equal(str, '200000000000000')
    })

    it('should convert a kwei number to the appropriate equivalent wei', function () {
      var result = normalizeNumberToWei(1.111, 'kwei')
      assert.equal(result.toString(10), '1111', 'accepts decimals')
    })

    it('should convert a ether number to the appropriate equivalent wei', function () {
      var result = normalizeNumberToWei(1.111, 'ether')
      assert.equal(result.toString(10), '1111000000000000000', 'accepts decimals')
    })
  })
  describe('#isHex', function () {
    it('should return true when given a hex string', function () {
      var result = isHex('c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2')
      assert(result)
    })

    it('should return false when given a non-hex string', function () {
      var result = isHex('c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714imnotreal')
      assert(!result)
    })

    it('should return false when given a string containing a non letter/number character', function () {
      var result = isHex('c3ab8ff13720!8ad9047dd39466b3c%8974e592c2fa383d4a396071imnotreal')
      assert(!result)
    })

    it('should return true when given a hex string with hex-prefix', function () {
      var result = isHex('0xc3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2')
      assert(result)
    })
  })

  describe('#ifRSK', function () {
    it('checks if this is RSK chain', function () {
      assert(ifRSK(30))
      assert(ifRSK(31))
      assert(!ifRSK(1))
      assert(!ifRSK())
    })
  })

  describe('#ifRSKByProviderType', function () {
    it('checks if this is RSK chain based on provider type', function () {
      assert(ifRSKByProviderType('rsk'))
      assert(ifRSKByProviderType('rsk_testnet'))
      assert(!ifRSKByProviderType('mainnet'))
      assert(!ifRSKByProviderType())
    })
  })

  describe('#ifPOA', function () {
    it('checks if this is POA chain', function () {
      assert(ifPOA(77))
      assert(ifPOA(99))
      assert(ifPOA(100))
      assert(!ifPOA(1))
      assert(!ifPOA())
    })
  })

  const addr = '0xB707b030A7887a21cc595Cd139746A8c2Ed91615'
  const addrRSKMainnet = '0xB707b030A7887a21Cc595cD139746A8c2ED91615'
  const addrRSKTestnet = '0xB707b030a7887a21Cc595CD139746a8C2ED91615'
  const addrETHMainnet = '0xB707b030A7887a21cc595Cd139746A8c2Ed91615'
  describe('#toChecksumAddress', function () {
    it('calculates correct checksum', function () {
      var resultMainnet = toChecksumAddress('30', addr)
      assert.equal(resultMainnet, addrRSKMainnet)
      var resultTestnet = toChecksumAddress('31', addr)
      assert.equal(resultTestnet, addrRSKTestnet)
      var resultNotRSK = toChecksumAddress('1', addr)
      assert.equal(resultNotRSK, addrETHMainnet)
    })
  })

  describe('#isValidChecksumAddress', function () {
    it('checks if is valid checksum address', function () {
      assert(isValidChecksumAddress('30', addrRSKMainnet))
      assert(isValidChecksumAddress('31', addrRSKTestnet))
      assert(isValidChecksumAddress('1', addrETHMainnet))
    })
  })

  describe('#isInfuraProvider', function () {
    it('checks, that the given provider is Infura provider', function () {
      assert(isInfuraProvider('kovan'))
      assert(isInfuraProvider('ropsten'))
      assert(isInfuraProvider('rinkeby'))
      assert(isInfuraProvider('mainnet'))
      assert(!isInfuraProvider('goerli_testnet'))
      assert(!isInfuraProvider('sokol'))
      assert(!isInfuraProvider('classic'))
      assert(!isInfuraProvider('rsk'))
    })
  })

  describe('#isKnownProvider', function () {
    it('checks, that the given provider is Infura provider', function () {
      assert(isKnownProvider('kovan'))
      assert(isKnownProvider('ropsten'))
      assert(isKnownProvider('rinkeby'))
      assert(isKnownProvider('mainnet'))
      assert(isKnownProvider('goerli_testnet'))
      assert(isKnownProvider('sokol'))
      assert(isKnownProvider('classic'))
      assert(isKnownProvider('rsk'))
      assert(!isKnownProvider('unknown_network'))
    })
  })
})
