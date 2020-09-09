import { useMemo, useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import contractMap from 'eth-contract-metadata'
import BigNumber from 'bignumber.js'
import { isEqual, shuffle } from 'lodash'
import { getValueFromWeiHex } from '../helpers/utils/conversions.util'
import { checksumAddress } from '../helpers/utils/util'
import { getFormattedTokenFiatAmount, getUnFormattedTokenFiatAmount } from '../helpers/utils/token-util'
import { getTokenExchangeRates, getConversionRate, getCurrentCurrency } from '../selectors'
import { getSwapsTokens } from '../ducks/swaps/swaps'
import { ETH_SWAPS_TOKEN_OBJECT } from '../helpers/constants/swaps'

const tokenList = shuffle(Object.entries(contractMap)
  .map(([address, tokenData]) => ({ ...tokenData, address: address.toLowerCase() }))
  .filter((tokenData) => Boolean(tokenData.erc20)))

function getRenderableTokenData (token, contractExchangeRates, conversionRate, currentCurrency) {
  const { symbol, name, address, iconUrl, string, balance, decimals } = token

  const formattedFiat = ((token.symbol === 'ETH' || contractExchangeRates[address]) && string)
    ? getFormattedTokenFiatAmount(
      symbol === 'ETH' ? 1 : contractExchangeRates[address],
      conversionRate,
      currentCurrency,
      string,
      symbol,
      true,
    )
    : ''
  const rawFiat = ((token.symbol === 'ETH' || contractExchangeRates[address]) && string)
    ? getUnFormattedTokenFiatAmount(
      symbol === 'ETH' ? 1 : contractExchangeRates[address],
      conversionRate,
      currentCurrency,
      string,
      symbol,
    )
    : 0

  const usedIconUrl = iconUrl || (contractMap[checksumAddress(address)] && `images/contract/${contractMap[checksumAddress(address)].logo}`)
  return {
    ...token,
    primaryLabel: symbol,
    secondaryLabel: name || contractMap[checksumAddress(address)]?.name,
    rightPrimaryLabel: string && `${(new BigNumber(string)).round(6).toString()} ${symbol}`,
    rightSecondaryLabel: formattedFiat,
    iconUrl: usedIconUrl,
    identiconAddress: usedIconUrl ? null : address,
    balance,
    decimals,
    name: name || contractMap[checksumAddress(address)]?.name,
    rawFiat,
  }
}

export function useTokensToSearch ({ providedTokens, swapsTokens: _swapsTokens, rawEthBalance, usersTokens = [], topTokens = {}, includeEth = true }) {
  const tokenConversionRates = useSelector(getTokenExchangeRates)

  const [memoizedTokenConversionRates, setMemoizedTokenConversionRates] = useState(tokenConversionRates)
  useEffect(() => {
    if (!isEqual(tokenConversionRates, memoizedTokenConversionRates)) {
      setMemoizedTokenConversionRates(tokenConversionRates)
    }
  }, [memoizedTokenConversionRates, tokenConversionRates])
  const [memoizedTopTokens, setMemoizedTopTokens] = useState(topTokens)
  useEffect(() => {
    if (!isEqual(topTokens, memoizedTopTokens)) {
      setMemoizedTopTokens(topTokens)
    }
  }, [memoizedTopTokens, topTokens])

  const conversionRate = useSelector(getConversionRate)
  const currentCurrency = useSelector(getCurrentCurrency)
  const swapsTokens = useSelector(getSwapsTokens) || []
  let tokensToSearch = providedTokens || _swapsTokens || swapsTokens
  if (!tokensToSearch.length && (providedTokens === undefined)) {
    tokensToSearch = tokenList
  }
  const [memoizedTokensToSearch, setMemoizedTokensToSearch] = useState(tokensToSearch)
  useEffect(() => {
    if ((memoizedTokensToSearch.length !== tokensToSearch.length) || (!isEqual(memoizedTokensToSearch[0], tokensToSearch[0]))) {
      setMemoizedTokensToSearch(tokensToSearch)
    }
  }, [memoizedTokensToSearch, tokensToSearch])

  return useMemo(() => {
    const decEthBalance = getValueFromWeiHex({ value: rawEthBalance, numberOfDecimals: 4, toDenomination: 'ETH' })
    const ethToken = getRenderableTokenData(
      { ...ETH_SWAPS_TOKEN_OBJECT, balance: rawEthBalance, string: decEthBalance },
      memoizedTokenConversionRates,
      conversionRate,
      currentCurrency,
    )

    const usersTokensAddressMap = usersTokens.reduce((acc, token) => ({ ...acc, [token.address]: token }), {})

    const tokensToSearchBuckets = {
      owned: includeEth ? [ethToken] : [],
      top: [],
      others: [],
    }
    memoizedTokensToSearch.forEach((token) => {
      const renderableDataToken = getRenderableTokenData({ ...usersTokensAddressMap[token.address], ...token }, memoizedTokenConversionRates, conversionRate, currentCurrency)
      if (usersTokensAddressMap[token.address] && ((renderableDataToken.symbol === 'ETH') || Number(renderableDataToken.balance ?? 0) !== 0)) {
        tokensToSearchBuckets.owned.push(renderableDataToken)
      } else if (memoizedTopTokens[token.address]) {
        tokensToSearchBuckets.top[memoizedTopTokens[token.address].index] = renderableDataToken
      } else {
        tokensToSearchBuckets.others.push(renderableDataToken)
      }
    })

    tokensToSearchBuckets.owned = tokensToSearchBuckets.owned.sort(({ rawFiat }, { rawFiat: secondRawFiat }) => {
      return ((new BigNumber(rawFiat)).gt(secondRawFiat) ? -1 : 1)
    })
    tokensToSearchBuckets.top = tokensToSearchBuckets.top.filter((token) => token)
    return [
      ...tokensToSearchBuckets.owned,
      ...tokensToSearchBuckets.top,
      ...tokensToSearchBuckets.others,
    ]
  }, [memoizedTokensToSearch, rawEthBalance, usersTokens, memoizedTokenConversionRates, conversionRate, currentCurrency, memoizedTopTokens, includeEth])
}
