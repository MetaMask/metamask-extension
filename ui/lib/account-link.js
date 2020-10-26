export default function getAccountLink (address, network, rpcPrefs) {
  if (rpcPrefs && rpcPrefs.blockExplorerUrl) {
    return `${rpcPrefs.blockExplorerUrl}/address/${address}`
  }

  const MAINNET_LANCHED =
    new Date().getTime() >
    new Date(
      'Thu Oct 29 2020 00:10:00 GMT+0800 (China Standard Time)'
    ).getTime()
  const net = parseInt(network)
  let link
  switch (net) {
    case 1029: // main net
      link = `https://confluxscan.io/${
        MAINNET_LANCHED ? 'address' : 'accountdetail'
      }/${address}`
      break
    case 2: // main net
      link = `https://confluxscan.io/${
        MAINNET_LANCHED ? 'address' : 'accountdetail'
      }/${address}`
      break
    case 1: // test net
      link = `https://testnet.confluxscan.io/${
        MAINNET_LANCHED ? 'address' : 'accountdetail'
      }/${address}`
      break
    default:
      link = `https://confluxscan.io/${
        MAINNET_LANCHED ? 'address' : 'accountdetail'
      }/${address}`
      break
  }

  return link
}
