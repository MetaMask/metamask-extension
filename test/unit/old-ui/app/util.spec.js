const assert = require('assert')
const { countSignificantDecimals, getCurrentKeyring, ifLooseAcc, ifContractAcc } = require('../../../../old-ui/app/util')

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

describe('getCurrentKeyring(address, keyrings, identities) function', () => {
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
   }, getCurrentKeyring(address, keyrings, identities))
  })

  it('returns keyring matched to address', () => {
    assert.deepEqual(null, getCurrentKeyring('0x9053a0Fe25fc45367d06B2e04528BDb4c1A03eaB', keyrings, identities))
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
