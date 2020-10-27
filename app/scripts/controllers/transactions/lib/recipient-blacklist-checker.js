import Config from './recipient-blacklist.js'

/** @module*/
export default {
  checkAccount,
}

/**
 * Checks if a specified account on a specified network is blacklisted.
  @param {number} networkId
  @param {string} account
*/
function checkAccount (networkId, account) {
  const MAINNET_LANCHED =
    new Date().getTime() >
    new Date(
      'Thu Oct 29 2020 00:10:00 GMT+0800 (China Standard Time)'
    ).getTime()
  const mainnetId = MAINNET_LANCHED ? 1029 : 2
  if (networkId !== mainnetId) {
    return
  }

  const accountToCheck = account.toLowerCase()
  if (Config.blacklist.includes(accountToCheck)) {
    throw new Error('Recipient is a public account')
  }
}
