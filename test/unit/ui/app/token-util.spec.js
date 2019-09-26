const assert = require('assert')
const {
  calcTokenAmount,
  getSymbolAndDecimals,
  tokenInfoGetter,
} = require('../../../../ui/app/helpers/utils/token-util')

const Eth = require('ethjs')

const { createTestProviderTools } = require('../../../stub/provider')
const provider = createTestProviderTools({ scaffold: {}}).provider

describe('', () => {

  const token = {
    'address': '0x108cf70c7d384c552f42c07c41c0e1e46d77ea0d',
    'symbol': 'TEST',
    'decimals': '0',
  }

  const tokens = [
    token,
    {
      'address': '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
      'decimals': '8',
      'symbol': 'TEST2',
    },
    {
      'address': '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
      'symbol': 'META',
      'decimals': '18',
    },
  ]
  beforeEach(() => {
    global.eth = new Eth(provider)
  })

  it('gets symbol and decimal when selecting an address from the token list', async () => {
    const symbolAndDecimal = await getSymbolAndDecimals('0x108cf70c7d384c552f42c07c41c0e1e46d77ea0d', tokens)
    assert.deepEqual(symbolAndDecimal, { symbol: 'TEST', decimals: '0' })
  })

  it('calculates token amount and it decimal percision', () => {
    const tokenAmount = calcTokenAmount(1392576986169572000, 18)
    assert(tokenAmount, 1.392576986169572)
  })

  it('#tokenInfoGetter returns default empty string and 0 for symbol and decimal', async () => {
    const token = await tokenInfoGetter()()
    assert.equal(token.symbol, '')
    assert.equal(token.decimals, '0')
  })
})
