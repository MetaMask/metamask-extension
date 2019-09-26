const assert = require('assert')
const getBuyEthUrl = require('../../../app/scripts/lib/buy-eth-url')

describe('buy-eth-url', function () {
  const mainnet = {
    network: '1',
    amount: 5,
    address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
  }
  const ropsten = {
    network: '3',
  }
  const rinkeby = {
    network: '4',
  }
  const kovan = {
    network: '42',
  }

  it('returns coinbase url with amount and address for network 1', function () {
    const wyreUrl = getBuyEthUrl(mainnet)

    assert.equal(wyreUrl, 'https://dash.sendwyre.com/sign-up')

  })

  it('returns metamask ropsten faucet for network 3', function () {
    const ropstenUrl = getBuyEthUrl(ropsten)
    assert.equal(ropstenUrl, 'https://faucet.metamask.io/')
  })

  it('returns rinkeby dapp for network 4', function () {
    const rinkebyUrl = getBuyEthUrl(rinkeby)
    assert.equal(rinkebyUrl, 'https://www.rinkeby.io/')
  })

  it('returns kovan github test faucet for network 42', function () {
    const kovanUrl = getBuyEthUrl(kovan)
    assert.equal(kovanUrl, 'https://github.com/kovan-testnet/faucet')
  })

})

