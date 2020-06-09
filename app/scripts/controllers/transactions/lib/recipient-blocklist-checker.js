import blocklist from './recipient-blocklist'

/**
 * Checks if a specified account on a specified network is blocked
 * @param {number} networkId
 * @param {string} account
 * @throws {Error} if the account is blocked on mainnet
 */
export function throwIfAccountIsBlocked (networkId, account) {
  const mainnetId = 1
  if (networkId !== mainnetId) {
    return
  }

  const accountToCheck = account.toLowerCase()
  if (blocklist.includes(accountToCheck)) {
    throw new Error('Recipient is a public account')
  }
}
