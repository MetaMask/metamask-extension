import { useSelector } from 'react-redux'
import { getSelectedAccount } from '../selectors'
import { ETH_SWAPS_TOKEN_OBJECT } from '../helpers/constants/swaps'
import {
  getValueFromWeiHex,
  hexToDecimal,
} from '../helpers/utils/conversions.util'

/**
 * @typedef {Object} SwapsEthToken
 * @property {string} symbol - The symbol for ETH, namely "ETH"
 * @property {string} name - The name of the ETH currency, "Ether"
 * @property {string} address - A substitute address for the metaswap-api to
 * recognize the ETH token
 * @property {string} decimals - The number of ETH decimals, i.e. 18
 * @property {string} balance - The user's ETH balance in decimal wei, with a
 * precision of 4 decimal places
 * @property {string} string - The user's ETH balance in decimal ETH
 */

/**
 * Swaps related code uses token objects for various purposes. These objects
 * always have the following properties: `symbol`, `name`, `address`, and
 * `decimals`.
 *
 * When available for the current account, the objects can have `balance` and
 * `string` properties.
 * `balance` is the users token balance in decimal values, denominated in the
 * minimal token units (according to its decimals).
 * `string` is the token balance in a readable format, ready for rendering.
 *
 * Swaps treats ETH as a token, and we use the ETH_SWAPS_TOKEN_OBJECT constant
 * to set the standard properties for the token. The useSwapsEthToken hook
 * extends that object with `balance` and `balance` values of the same type as
 * in regular ERC-20 token objects, per the above description.
 *
 * @returns {SwapsEthToken} The token object representation of the currently
 * selected account's ETH balance, as expected by the Swaps API.
 */
export function useSwapsEthToken() {
  const selectedAccount = useSelector(getSelectedAccount)
  const { balance } = selectedAccount

  return {
    ...ETH_SWAPS_TOKEN_OBJECT,
    balance: hexToDecimal(balance),
    string: getValueFromWeiHex({
      value: balance,
      numberOfDecimals: 4,
      toDenomination: 'ETH',
    }),
  }
}
