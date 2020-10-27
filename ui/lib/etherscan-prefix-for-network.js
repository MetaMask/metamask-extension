export default function etherscanNetworkPrefix (network) {
  const net = parseInt(network)
  let prefix
  switch (net) {
    case 1029:
      prefix = ''
      break
    case 2:
      prefix = ''
      break
    case 1:
      prefix = ''
      break
    case 0:
      prefix = 'testnet.'
      break
    default:
      prefix = ''
  }
  return prefix
}
