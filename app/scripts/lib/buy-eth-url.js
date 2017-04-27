module.exports = getBuyEthUrl

function getBuyEthUrl ({ network, amount, address }) {
  let url
  switch (network) {
    case '1':
      url = `https://buy.coinbase.com/?code=9ec56d01-7e81-5017-930c-513daa27bb6a&amount=${amount}&address=${address}&crypto_currency=ETH`
      break

    case '3':
      url = 'https://faucet.metamask.io/'
      break

    case '4':
      url = 'https://www.rinkeby.io/'
      break

    case '42':
      url = 'https://github.com/kovan-testnet/faucet'
      break
  }
  return url
}
