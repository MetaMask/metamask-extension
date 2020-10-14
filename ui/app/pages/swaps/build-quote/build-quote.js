import React, { useContext, useEffect, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'
import classnames from 'classnames'
import { uniqBy } from 'lodash'
import { useHistory } from 'react-router-dom'
import { MetaMetricsContext } from '../../../contexts/metametrics.new'
import { useTokensToSearch } from '../../../hooks/useTokensToSearch'
import { useEqualityCheck } from '../../../hooks/useEqualityCheck'
import { useSwapsEthToken } from '../../../hooks/useSwapsEthToken'
import { I18nContext } from '../../../contexts/i18n'
import DropdownInputPair from '../dropdown-input-pair'
import DropdownSearchList from '../dropdown-search-list'
import SlippageButtons from '../slippage-buttons'
import { getTokens } from '../../../ducks/metamask/metamask'

import {
  fetchQuotesAndSetQuoteState,
  setSwapsFromToken,
  setSwapToToken,
  getFromToken,
  getToToken,
  getBalanceError,
  getTopAssets,
  getFetchParams,
} from '../../../ducks/swaps/swaps'
import { getValueFromWeiHex, hexToDecimal } from '../../../helpers/utils/conversions.util'
import { calcTokenAmount } from '../../../helpers/utils/token-util'
import { usePrevious } from '../../../hooks/usePrevious'
import { useTokenTracker } from '../../../hooks/useTokenTracker'
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount'
import { useEthFiatAmount } from '../../../hooks/useEthFiatAmount'

import { ETH_SWAPS_TOKEN_OBJECT } from '../../../helpers/constants/swaps'

import { resetSwapsPostFetchState, removeToken } from '../../../store/actions'
import { fetchTokenPrice, fetchTokenBalance } from '../swaps.util'
import SwapsFooter from '../swaps-footer'

const fuseSearchKeys = [{ name: 'name', weight: 0.499 }, { name: 'symbol', weight: 0.499 }, { name: 'address', weight: 0.002 }]

export default function BuildQuote ({
  inputValue,
  onInputChange,
  ethBalance,
  setMaxSlippage,
  maxSlippage,
  selectedAccountAddress,
}) {
  const t = useContext(I18nContext)
  const dispatch = useDispatch()
  const history = useHistory()
  const metaMetricsEvent = useContext(MetaMetricsContext)

  const [fetchedTokenExchangeRate, setFetchedTokenExchangeRate] = useState(undefined)

  const balanceError = useSelector(getBalanceError)
  const fetchParams = useSelector(getFetchParams)
  const { sourceTokenInfo = {}, destinationTokenInfo = {} } = fetchParams?.metaData || {}
  const tokens = useSelector(getTokens)
  const topAssets = useSelector(getTopAssets)
  const fromToken = useSelector(getFromToken)
  const toToken = useSelector(getToToken) || destinationTokenInfo
  const swapsEthToken = useSwapsEthToken()
  const fetchParamsFromToken = sourceTokenInfo?.symbol === 'ETH'
    ? swapsEthToken
    : sourceTokenInfo

  const { loading, tokensWithBalances } = useTokenTracker(tokens)

  // If the fromToken was set in a call to `onFromSelect` (see below), and that from token has a balance
  // but is not in tokensWithBalances or tokens, then we want to add it to the usersTokens array so that
  // the balance of the token can appear in the from token selection dropdown
  const fromTokenArray = fromToken?.symbol !== 'ETH' && fromToken?.balance
    ? [fromToken]
    : []
  const usersTokens = uniqBy([...tokensWithBalances, ...tokens, ...fromTokenArray], 'address')
  const memoizedUsersTokens = useEqualityCheck(usersTokens)

  const selectedFromToken = useTokensToSearch({
    providedTokens: fromToken || fetchParamsFromToken ? [fromToken || fetchParamsFromToken] : [],
    usersTokens: memoizedUsersTokens,
    onlyEth: (fromToken || fetchParamsFromToken)?.symbol === 'ETH',
    singleToken: true,
  })[0]

  const tokensToSearch = useTokensToSearch({
    usersTokens: memoizedUsersTokens,
    topTokens: topAssets,
  })
  const selectedToToken = tokensToSearch.find(({ address }) => address === toToken?.address) || toToken

  const {
    address: fromTokenAddress,
    symbol: fromTokenSymbol,
    string: fromTokenString,
    decimals: fromTokenDecimals,
    balance: rawFromTokenBalance,
  } = selectedFromToken || {}

  const fromTokenBalance = rawFromTokenBalance && calcTokenAmount(rawFromTokenBalance, fromTokenDecimals).toString(10)

  const prevFromTokenBalance = usePrevious(fromTokenBalance)

  const swapFromTokenFiatValue = useTokenFiatAmount(
    fromTokenAddress,
    inputValue || 0,
    fromTokenSymbol,
    {
      showFiat: true,
    },
    true,
  )
  const swapFromEthFiatValue = useEthFiatAmount(inputValue || 0, { showFiat: true }, true)
  const swapFromFiatValue = fromTokenSymbol === 'ETH'
    ? swapFromEthFiatValue
    : swapFromTokenFiatValue

  const onFromSelect = (token) => {
    if (token?.address && !swapFromFiatValue && fetchedTokenExchangeRate !== null) {
      fetchTokenPrice(token.address)
        .then((rate) => {
          if (rate !== null && rate !== undefined) {
            setFetchedTokenExchangeRate(rate)
          }
        })
    } else {
      setFetchedTokenExchangeRate(null)
    }
    if (token?.address && !memoizedUsersTokens.find((usersToken) => usersToken.address === token.address)) {
      fetchTokenBalance(token.address, selectedAccountAddress)
        .then((fetchedBalance) => {
          if (fetchedBalance?.balance) {
            const balanceAsDecString = fetchedBalance.balance.toString(10)
            const userTokenBalance = calcTokenAmount(balanceAsDecString, token.decimals)
            dispatch(setSwapsFromToken({ ...token, string: userTokenBalance.toString(10), balance: balanceAsDecString }))
          }
        })
    }
    dispatch(setSwapsFromToken(token))
    onInputChange(token?.address ? inputValue : '', token.string, token.decimals)
  }

  const { destinationTokenAddedForSwap } = fetchParams || {}
  const { address: toAddress } = toToken || {}
  const onToSelect = useCallback((token) => {
    if (destinationTokenAddedForSwap && token.address !== toAddress) {
      dispatch(removeToken(toAddress))
    }
    dispatch(setSwapToToken(token))
  }, [dispatch, destinationTokenAddedForSwap, toAddress])

  const hideDropdownItemIf = useCallback((item) => item.address === fromTokenAddress, [fromTokenAddress])

  const tokensWithBalancesFromToken = tokensWithBalances.find((token) => token.address === fromToken?.address)
  const previousTokensWithBalancesFromToken = usePrevious(tokensWithBalancesFromToken)

  useEffect(() => {
    const notEth = tokensWithBalancesFromToken?.address !== ETH_SWAPS_TOKEN_OBJECT.address
    const addressesAreTheSame = tokensWithBalancesFromToken?.address === previousTokensWithBalancesFromToken?.address
    const balanceHasChanged = tokensWithBalancesFromToken?.balance !== previousTokensWithBalancesFromToken?.balance
    if (notEth && addressesAreTheSame && balanceHasChanged) {
      dispatch(setSwapsFromToken({ ...fromToken, balance: tokensWithBalancesFromToken?.balance, string: tokensWithBalancesFromToken?.string }))
    }
  }, [dispatch, tokensWithBalancesFromToken, previousTokensWithBalancesFromToken, fromToken])

  // If the eth balance changes while on build quote, we update the selected from token
  useEffect(() => {
    if (fromToken?.address === ETH_SWAPS_TOKEN_OBJECT.address && (fromToken?.balance !== ethBalance)) {
      dispatch(setSwapsFromToken({
        ...fromToken,
        balance: hexToDecimal(ethBalance),
        string: getValueFromWeiHex({ value: ethBalance, numberOfDecimals: 4, toDenomination: 'ETH' }),
      }))
    }
  }, [dispatch, fromToken, ethBalance])

  useEffect(() => {
    if (prevFromTokenBalance !== fromTokenBalance) {
      onInputChange(inputValue, fromTokenBalance)
    }
  }, [onInputChange, prevFromTokenBalance, inputValue, fromTokenBalance])

  useEffect(() => {
    dispatch(resetSwapsPostFetchState())
  }, [dispatch])

  return (
    <div className="build-quote">
      <div className="build-quote__content">
        <div className="build-quote__dropdown-input-pair-header">
          <div className="build-quote__input-label">{t('swapSwapFrom')}</div>
          {fromTokenSymbol !== 'ETH' && (
            <div
              className="build-quote__max-button"
              onClick={() => onInputChange(fromTokenBalance || '0', fromTokenBalance)}
            >{t('max')}
            </div>
          )}
        </div>
        <DropdownInputPair
          onSelect={onFromSelect}
          itemsToSearch={tokensToSearch}
          onInputChange={(value) => {
            onInputChange(value, fromTokenBalance)
          }}
          inputValue={inputValue}
          leftValue={inputValue && swapFromFiatValue}
          selectedItem={selectedFromToken}
          maxListItems={30}
          loading={loading && (!tokensToSearch?.length || !topAssets || !Object.keys(topAssets).length)}
          selectPlaceHolderText="Select"
          hideItemIf={(item) => item.address === selectedToToken?.address}
          listContainerClassName="build-quote__open-dropdown"
          autoFocus
        />
        <div
          className={classnames('build-quote__balance-message', {
            'build-quote__balance-message--error': balanceError,
          })}
        >
          {!balanceError && fromTokenSymbol && t('swapYourTokenBalance', [fromTokenString || '0', fromTokenSymbol])}
          {balanceError && fromTokenSymbol && (
            <div className="build-quite__insufficient-funds">
              <div className="build-quite__insufficient-funds-first">{t('swapsNotEnoughForTx', [fromTokenSymbol])}</div>
              <div className="build-quite__insufficient-funds-second">{t('swapYourTokenBalance', [fromTokenString || '0', fromTokenSymbol])}</div>
            </div>
          )}
        </div>
        <div
          className="build-quote__swap-arrows-row"
        >
          <div
            className="build-quote__swap-arrows"
            onClick={() => {
              onToSelect(selectedFromToken)
              onFromSelect(selectedToToken)
            }}
          />
        </div>
        <div className="build-quote__dropdown-swap-to-header">
          <div className="build-quote__input-label">{t('swapSwapTo')}</div>
        </div>
        <DropdownSearchList
          startingItem={selectedToToken}
          itemsToSearch={tokensToSearch}
          searchPlaceholderText={t('swapSearchForAToken')}
          fuseSearchKeys={fuseSearchKeys}
          selectPlaceHolderText="Select a token"
          maxListItems={30}
          onSelect={onToSelect}
          loading={loading && (!tokensToSearch?.length || !topAssets || !Object.keys(topAssets).length)}
          externallySelectedItem={selectedToToken}
          hideItemIf={hideDropdownItemIf}
          listContainerClassName="build-quote__open-to-dropdown"
          hideRightLabels
          defaultToAll

        />
        <div className="build-quote__slippage-buttons-container">
          <SlippageButtons
            onSelect={(newSlippage) => {
              setMaxSlippage(newSlippage)
            }}
          />
        </div>
      </div>
      <SwapsFooter
        onSubmit={() => {
          dispatch(fetchQuotesAndSetQuoteState(history, inputValue, maxSlippage, metaMetricsEvent))
        }}
        submitText={t('swapGetQuotes')}
        disabled={((!Number(inputValue) || !selectedToToken?.address) || (Number(maxSlippage) === 0))}
        hideCancel
      />
    </div>
  )
}

BuildQuote.propTypes = {
  maxSlippage: PropTypes.number,
  inputValue: PropTypes.string,
  onInputChange: PropTypes.func,
  ethBalance: PropTypes.string,
  setMaxSlippage: PropTypes.func,
  selectedAccountAddress: PropTypes.string,
}
