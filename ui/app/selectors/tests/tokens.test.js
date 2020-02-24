import assert from 'assert'
import { selectedTokenSelector } from '../tokens'

const metaToken = {
  'address': '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
  'symbol': 'META',
  'decimals': 18,
}

const state = {
  metamask: {
    selectedTokenAddress: '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
    tokens: [
      {
        'address': '0x06012c8cf97bead5deae237070f9587f8e7a266d',
        'symbol': 'CK',
        'decimals': 0,
      },
      metaToken,
    ],
  },
}
describe('Selected Token Selector', function () {
  it('selects token info from tokens based on selectedTokenAddress in state', function () {
    const tokenInfo = selectedTokenSelector(state)
    assert.equal(tokenInfo, metaToken)
  })
})
