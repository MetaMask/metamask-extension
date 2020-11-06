export default function getAccountLink(address, network, rpcPrefs) {
  if (rpcPrefs && rpcPrefs.blockExplorerUrl) {
    return `${rpcPrefs.blockExplorerUrl.replace(
      /\/+$/u,
      '',
    )}/address/${address}`
  }

  // eslint-disable-next-line radix
  const net = parseInt(network)
  switch (net) {
    case 1: // main net
      return `https://etherscan.io/address/${address}`
    case 2: // morden test net
      return `https://morden.etherscan.io/address/${address}`
    case 3: // ropsten test net
      return `https://ropsten.etherscan.io/address/${address}`
    case 4: // rinkeby test net
      return `https://rinkeby.etherscan.io/address/${address}`
    case 42: // kovan test net
      return `https://kovan.etherscan.io/address/${address}`
    case 5: // goerli test net
      return `https://goerli.etherscan.io/address/${address}`
    default:
      return ''
  }
}
