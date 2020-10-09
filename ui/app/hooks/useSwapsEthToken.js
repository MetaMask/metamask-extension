import { useSelector } from 'react-redux'
import { getSelectedAccount } from '../selectors'
import { ETH_SWAPS_TOKEN_OBJECT } from '../helpers/constants/swaps'
import { getValueFromWeiHex, hexToDecimal } from '../helpers/utils/conversions.util'

/**
 * @typedef {Object} SwapsEthToken
 * @property {string} symbol - the symbol for ETH, namely "ETH"
 * @property {string} name - the name of the ETH currency, "Ether"
 * @property {string} address - a substitute address for the metaswap-api to recognize the eth token
 * @property {string} decimals - the number of decimal places of divisibility of eth, 1 ETH is represented
 *  by 10^18 of its natural unit ( 1 Ether = 1,000,000,000,000,000,000 wei ). Hence, this will be 18.
 * @property {string} balance - the users ETH balance in decimal WEI
 * @property {string} string - the users ETH balance in decimal ETH
 */

/**
 * Swaps related code uses token objects for various purposes. These objects always have the following
 * properties: symbol, name, address, and decimals. When available for the current account, the objects
 * can have balance and string properties. `balance` is the users token balance in decimal values, denominated
 * in the minimal token units (according to its decimals). `string` is the token balance in a readable
 * format, ready for rendering. Swaps treats ETH as a token, and we use the ETH_SWAPS_TOKEN_OBJECT to
 * set the standard properties for the token. The useSwapsEthToken hook extends that object with balance
 * and string values of the same type as found in ERC-20 token objects, as described above.
 *
 * @returns {object}
 */
export function useSwapsEthToken () {
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
