import blocklist from './recipient-blocklist'
import { MAINNET_NETWORK_ID } from '../../network/enums'

/**
 * Checks if a specified account on a specified network is blocked
 * @param {number} networkId
 * @param {string} account
 * @throws {Error} if the account is blocked on mainnet
 */
export function throwIfAccountIsBlocked (networkId, account) {
  if (networkId !== MAINNET_NETWORK_ID) {
    return
  }

  const accountToCheck = account.toLowerCase()
  if (blocklist.includes(accountToCheck)) {
    throw new Error('Recipient is a public account')
  }
}
