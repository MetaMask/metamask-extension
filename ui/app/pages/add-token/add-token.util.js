import { checkExistingAddresses } from '../../helpers/utils/util'

export function initializeTokenListForSearchability (contractMap, usersTokens = [], pendingTokens = {}) {
  return Object.entries(contractMap)
    .map(([address, tokenData]) => Object.assign({}, tokenData, {
      address,
      disabled: checkExistingAddresses(address, usersTokens),
      selected: pendingTokens[address],
    }))
    .filter((tokenData) => Boolean(tokenData.erc20))
}

export function transformTokensForSearchList (tokensToTransform = []) {
  return tokensToTransform
    .filter(({ logo, symbol, name }) => Boolean(logo || symbol || name))
    .map((tokenData) => ({
      ...tokenData,
      backgroundImageUrl: `images/contract/${tokenData.logo}`,
      primaryLabel: `${tokenData.name} (${tokenData.symbol})`,
    }))
}
