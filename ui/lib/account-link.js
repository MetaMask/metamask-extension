module.exports = function (address, network, rpcPrefs) {
  if (rpcPrefs.blockExplorerUrl) {
    return `${rpcPrefs.blockExplorerUrl}/address/${address}`
  }

  const net = parseInt(network)
  let link
  switch (net) {
    case 1: // main net
      link = `https://etherscan.io/address/${address}`
      break
    case 2: // morden test net
      link = `https://morden.etherscan.io/address/${address}`
      break
    case 3: // ropsten test net
      link = `https://ropsten.etherscan.io/address/${address}`
      break
    case 4: // rinkeby test net
      link = `https://rinkeby.etherscan.io/address/${address}`
      break
    case 42: // kovan test net
      link = `https://kovan.etherscan.io/address/${address}`
      break
    case 5: // goerli test net
      link = `https://goerli.etherscan.io/address/${address}`
      break
    default:
      link = ''
      break
  }

  return link
}
