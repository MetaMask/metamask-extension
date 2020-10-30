const createExplorerLink = function (hash, networkId) {
  switch (networkId) {
    case '1029':
      return `http://confluxscan.io/transaction/${hash}`
    case '1':
      return `http://testnet.confluxscan.io/transaction/${hash}`
    default:
      return `http://confluxscan.io/transaction/${hash}`
  }
}

const createAccountLink = function (address, networkId) {
  switch (networkId) {
    case '1029':
      return `http://confluxscan.io/address/${address}`
    case '1':
      return `http://testnet.confluxscan.io/address/${address}`
    default:
      return `http://confluxscan.io/address/${address}`
  }
}

module.exports = {
  createExplorerLink,
  createAccountLink,
}
