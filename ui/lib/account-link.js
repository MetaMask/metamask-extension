export default function getAccountLink (address, network, rpcPrefs) {
  if (rpcPrefs && rpcPrefs.blockExplorerUrl) {
    return `${rpcPrefs.blockExplorerUrl}/address/${address}`
  }

  const net = parseInt(network)
  let link
  switch (net) {
    case 1: // main net
    case 2: // test net
    case 3:
    case 4:
    case 5:
      link = `https://confluxscan.io/accountdetail/${address}`
      break
    default:
      link = ''
      break
  }

  return link
}
