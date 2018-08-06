import { createSelector } from 'reselect'

export const selectedTokenAddressSelector = state => state.metamask.selectedTokenAddress
export const tokenSelector = state => state.metamask.tokens
export const selectedTokenSelector = createSelector(
  tokenSelector,
  selectedTokenAddressSelector,
  (tokens = [], selectedTokenAddress = '') => {
    return tokens.find(({ address }) => address === selectedTokenAddress)
  }
)
