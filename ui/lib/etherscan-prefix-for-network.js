export default function etherscanNetworkPrefix (network) {
  const net = parseInt(network)
  let prefix
  switch (net) {
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
      prefix = ''
      break
    default:
      prefix = ''
  }
  return prefix
}
