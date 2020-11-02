export default function getAccountLink (address, network, rpcPrefs) {
  if (rpcPrefs && rpcPrefs.blockExplorerUrl) {
    return `${rpcPrefs.blockExplorerUrl}/address/${address}`
  }

  const net = parseInt(network)
  let link
  switch (net) {
    case 1029: // main net
      link = `https://confluxscan.io/address/${address}`
      break
    case 2: // main net
      link = `https://confluxscan.io/address/${address}`
      break
    case 1: // test net
      link = `https://testnet.confluxscan.io/address/${address}`
      break
    default:
      link = `https://confluxscan.io/address/${address}`
      break
  }

  return link
}
