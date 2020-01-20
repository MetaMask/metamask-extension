const createExplorerLink = function (hash) {
  return `http://confluxscan.io/transactionsdetail/${hash}`
}

const createAccountLink = function (address) {
  return `http://confluxscan.io/accountdetail/${address}`
}

module.exports = {
  createExplorerLink,
  createAccountLink,
}
