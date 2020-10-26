const createExplorerLink = function (hash) {
  const MAINNET_LANCHED =
    new Date().getTime() >
    new Date(
      'Thu Oct 29 2020 00:10:00 GMT+0800 (China Standard Time)'
    ).getTime()
  return `http://confluxscan.io/${
    MAINNET_LANCHED ? 'transaction' : 'transactionsdetail'
  }/${hash}`
}

const createAccountLink = function (address) {
  const MAINNET_LANCHED =
    new Date().getTime() >
    new Date(
      'Thu Oct 29 2020 00:10:00 GMT+0800 (China Standard Time)'
    ).getTime()
  return `http://confluxscan.io/${
    MAINNET_LANCHED ? 'address' : 'accountdetail'
  }/${address}`
}

module.exports = {
  createExplorerLink,
  createAccountLink,
}
