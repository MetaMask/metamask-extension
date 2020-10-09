export default function getAccountLink (address, network, rpcPrefs) {
  if (rpcPrefs && rpcPrefs.blockExplorerUrl) {
    return `${rpcPrefs.blockExplorerUrl}/address/${address}`
  }

  const net = parseInt(network)
  let link
  switch (net) {
    case 2: // main net
      link = `https://confluxscan.io/accountdetail/${address}`
      break
    case 1: // test net
      link = `https://testnet.confluxscan.io/accountdetail/${address}`
      break
    default:
      link = `https://confluxscan.io/accountdetail/${address}`
      break
  }

  return link
}
