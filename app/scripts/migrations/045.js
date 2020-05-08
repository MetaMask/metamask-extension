import { toChecksumAddress } from 'ethereumjs-util'
// next version number
const version = 43

/*
Move tokens from Preferences Controller to Tokens Controller while convertiing the token addresses to checksum
*/

import { cloneDeep } from 'lodash'

export default {
  version,

  migrate: async function (originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData)
    versionedData.meta.version = version
    const state = versionedData.data
    versionedData.data = transformState(state)
    return versionedData
  },
}

function transformState (state) {

  if (state.PreferencesController && state.PreferencesController.accountTokens && state.PreferencesController.tokens) {
    const { PreferencesController: { accountTokens, tokens } } = state

    const checkSummedAccountTokens = accountTokensToChecksumAddresses(accountTokens)
    const checksummedTokenAddresses = tokensToChecksumAddresses(tokens)

    state = {
      ...state,
      TokensController: {
        allTokens: checkSummedAccountTokens,
        tokens: checksummedTokenAddresses,
      },
    }

    delete state.PreferencesController.accountTokens
    delete state.PreferencesController.tokens
    delete state.PreferencesController.assetImages
    delete state.PreferencesController.suggestedTokens

  }
  return state

}

function accountTokensToChecksumAddresses (accountTokens) {
  let allTokens = {}

  for (const address in accountTokens) {
    const checksumAddress = toChecksumAddress(address)
    allTokens = { ...allTokens, [checksumAddress]: accountTokens[address] }

    if (accountTokens.hasOwnProperty(address)) {
      const network = accountTokens[address]

      if (Object.keys(network).length !== 0) {

        for (const networkType in network) {
          network[networkType].map((contractInfo) => {
            contractInfo.address = toChecksumAddress(contractInfo.address)
          })
        }
      }

    }

  }
  return allTokens
}

function tokensToChecksumAddresses (tokens) {
  tokens.map((contractInfo) => {
    contractInfo.address = toChecksumAddress(contractInfo.address)
  })
  return tokens
}
