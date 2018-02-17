const genAccountLink = require('etherscan-link').createAccountLink
const explorerLink = require('etherscan-link').createExplorerLink

exports.createAccountLink = (accountId, chainId) => {
  switch (chainId) {
    case '1':
    case '3':
    case '4':
    case '42':
      return genAccountLink(accountId, chainId)
    case '99':
      return `https://core-explorer.poa.network/account/${accountId}`
  }
}
exports.createExplorerLink = (hash, chainId) => {
  switch (chainId) {
    case '1':
    case '3':
    case '4':
    case '42':
      return explorerLink(hash, parseInt(chainId))
    case '99':
      return `https://core-explorer.poa.network/tx/${hash}`
  }
}