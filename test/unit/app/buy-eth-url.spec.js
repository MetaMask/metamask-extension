const assert = require('assert')
const { getBuyEthUrl, getExchanges } = require('../../../app/scripts/lib/buy-eth-url')

describe('', function () {
  const mainnet = {
    network: '1',
    amount: 5,
    address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    ind: 0
  }
  const sokol = {
    network: '77',
    ind: 0
  }
  const ropsten = {
    network: '3',
    ind: 0
  }
  const rinkeby = {
    network: '4',
    ind: 0
  }
  const kovan1 = {
    network: '42',
    ind: 0
  }
  const kovan2 = {
    network: '42',
    ind: 1
  }

  it('returns coinbase url with amount and address for network 1', function () {
    const coinbaseUrl = getBuyEthUrl(mainnet)
    const coinbase = coinbaseUrl.match(/(https:\/\/buy.coinbase.com)/)
    const amount = coinbaseUrl.match(/(amount)\D\d/)
    const address = coinbaseUrl.match(/(address)(.*)(?=&)/)

    assert.equal(coinbase[0], 'https://buy.coinbase.com')
    assert.equal(amount[0], 'amount=5')
    assert.equal(address[0], 'address=0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc')

  })

  it('returns POA Sokol faucet for network 77', function () {
    const ropstenUrl = getBuyEthUrl(sokol)
    assert.equal(ropstenUrl, 'https://faucet.poa.network/')
  })

  it('returns metamask ropsten faucet for network 3', function () {
    const ropstenUrl = getBuyEthUrl(ropsten)
    assert.equal(ropstenUrl, 'https://faucet.metamask.io/')
  })

  it('returns rinkeby dapp for network 4', function () {
    const rinkebyUrl = getBuyEthUrl(rinkeby)
    assert.equal(rinkebyUrl, 'https://faucet.rinkeby.io/')
  })

  it('returns kovan github test faucet 1 for network 42', function () {
    const kovanUrl = getBuyEthUrl(kovan1)
    assert.equal(kovanUrl, 'https://faucet.kovan.network/')
  })

  it('returns kovan github test faucet 2 for network 42', function () {
    const kovanUrl = getBuyEthUrl(kovan2)
    assert.equal(kovanUrl, 'https://gitter.im/kovan-testnet/faucet/')
  })

  it('returns exchanges for POA core network', function () {
    const exchanges = getExchanges({network: 99})
    assert.deepEqual(exchanges, [
      {
        name: 'Binance',
        link: 'https://www.binance.com/en/trade/POA_ETH',
      },
      {
        name: 'BiBox',
        link: 'https://www.bibox.com/exchange?coinPair=POA_ETH',
      },
      {
        name: 'CEX Plus',
        link: 'http://cex.plus/market/poa_eth',
      },
    ])
  })

  it('returns xDai bridge link for xDai network', function () {
    const exchanges = getExchanges({network: 100})
    assert.deepEqual(exchanges, [
      {
        name: 'xDai TokenBridge',
        link: 'https://dai-bridge.poa.network/',
      },
    ])
  })

  it('returns xDai Coinbase link for Mainnet', function () {
    const exchanges = getExchanges({network: 1, amount: 1, address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'})
    assert.deepEqual(exchanges, [
      {
        link: `https://buy.coinbase.com/?code=9ec56d01-7e81-5017-930c-513daa27bb6a&amount=1&address=0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc&crypto_currency=ETH`,
      },
    ])
  })
})