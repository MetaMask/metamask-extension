module.exports = function (address, network) {
  const net = parseInt(network)
  let link
  switch (net) {
    case 88: // main net
      link = `https://explorer.etherzero.org/addr/${address}`
      break
    case 2: // morden test net
      link = `https://explorer.etherzero.org/addr/${address}`
      break
    case 3: // ropsten test net
      link = `https://explorer.etherzero.org/addr/${address}`
      break
    case 4: // rinkeby test net
      link = `https://explorer.etherzero.org/addr/${address}`
      break
    case 42: // kovan test net
      link = `https://explorer.etherzero.org/addr/${address}`
      break
    default:
      link = ''
      break
  }

  return link
}
