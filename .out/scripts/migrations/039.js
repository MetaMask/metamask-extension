import { cloneDeep } from 'lodash'
import ethUtil from 'ethereumjs-util'

const version = 39

const DAI_V1_CONTRACT_ADDRESS = '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359'
const DAI_V1_TOKEN_SYMBOL = 'DAI'
const SAI_TOKEN_SYMBOL = 'SAI'

function isOldDai(token = {}) {
  return (
    token &&
    typeof token === 'object' &&
    token.symbol === DAI_V1_TOKEN_SYMBOL &&
    ethUtil.toChecksumAddress(token.address) === DAI_V1_CONTRACT_ADDRESS
  )
}

/**
 * This migration renames the Dai token to Sai.
 *
 * As of 2019-11-18 Dai is now called Sai (refs https://git.io/JeooP) to facilitate
 * Maker's upgrade to Multi-Collateral Dai and this migration renames the token
 * at the old address.
 */
export default {
  version,
  async migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData)
    versionedData.meta.version = version
    const state = versionedData.data
    versionedData.data = transformState(state)
    return versionedData
  },
}

function transformState(state) {
  const { PreferencesController } = state

  if (PreferencesController) {
    const tokens = PreferencesController.tokens || []
    if (Array.isArray(tokens)) {
      for (const token of tokens) {
        if (isOldDai(token)) {
          token.symbol = SAI_TOKEN_SYMBOL
        }
      }
    }

    const accountTokens = PreferencesController.accountTokens || {}
    if (accountTokens && typeof accountTokens === 'object') {
      for (const address of Object.keys(accountTokens)) {
        const networkTokens = accountTokens[address]
        if (networkTokens && typeof networkTokens === 'object') {
          for (const network of Object.keys(networkTokens)) {
            const tokensOnNetwork = networkTokens[network]
            if (Array.isArray(tokensOnNetwork)) {
              for (const token of tokensOnNetwork) {
                if (isOldDai(token)) {
                  token.symbol = SAI_TOKEN_SYMBOL
                }
              }
            }
          }
        }
      }
    }
  }

  return state
}
