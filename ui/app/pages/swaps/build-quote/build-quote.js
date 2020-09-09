import React, { useContext, useEffect, useState, useRef, useCallback } from 'react'
import PropTypes from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'
import classnames from 'classnames'
import { uniqBy, isEqual } from 'lodash'
import { useTokensToSearch } from '../../../hooks/useTokensToSearch'
import { I18nContext } from '../../../contexts/i18n'
import DropdownInputPair from '../dropdown-input-pair'
import DropdownSearchList from '../dropdown-search-list'
import SlippageButtons from '../slippage-buttons'
import { getTokens } from '../../../ducks/metamask/metamask'

import {
  setSwapFromToken,
  setSwapToToken,
  getFromToken,
  getToToken,
  getBalanceError,
  getTopAssets,
  getFetchParams,
} from '../../../ducks/swaps/swaps'
import { convertTokenToFiat, formatCurrency } from '../../../helpers/utils/confirm-tx.util'
import { getValueFromWeiHex } from '../../../helpers/utils/conversions.util'
import { calcTokenAmount } from '../../../helpers/utils/token-util'
import { usePrevious } from '../../../hooks/usePrevious'
import { useTokenTracker, useTokenFiatAmount } from '../../../hooks/useTokenTracker'

import { ETH_SWAPS_TOKEN_OBJECT } from '../../../helpers/constants/swaps'

import { setTradeTxParams, setApproveTxParams, setQuotes, setMaxMode, resetSwapsPostFetchState } from '../../../store/actions'
import { fetchTokenPrice, fetchTokenBalance } from '../swaps.util'
import SwapsFooter from '../swaps-footer'

const fuseSearchKeys = [{ name: 'name', weight: 0.499 }, { name: 'symbol', weight: 0.499 }, { name: 'address', weight: 0.002 }]

export default function BuildQuote ({
  inputValue,
  onInputChange,
  ethBalance,
  setMaxSlippage,
  selectedAccountAddress,
  onSubmit,
}) {
  const t = useContext(I18nContext)
  const dispatch = useDispatch()

  const balanceError = useSelector(getBalanceError)
  const fetchParams = useSelector(getFetchParams)
  const tokens = useSelector(getTokens)
  const topAssets = useSelector(getTopAssets)
  const fromToken = useSelector(getFromToken)
  const toToken = useSelector(getToToken) || fetchParams?.destinationTokenInfo
  const fetchParamsFromToken = fetchParams?.sourceTokenInfo?.symbol === 'ETH'
    ? { ...ETH_SWAPS_TOKEN_OBJECT, string: getValueFromWeiHex({ value: ethBalance, numberOfDecimals: 4, toDenomination: 'ETH' }), balance: ethBalance }
    : fetchParams?.sourceTokenInfo

  const { loading, tokensWithBalances } = useTokenTracker(tokens)
  const usersTokens = uniqBy([...tokensWithBalances, ...tokens], 'address')
  const [memoizedUsersTokens, setMemoizedUsersTokens] = useState(usersTokens)
  useEffect(() => {
    if (!isEqual(usersTokens, memoizedUsersTokens)) {
      setMemoizedUsersTokens(usersTokens)
    }
  }, [usersTokens, memoizedUsersTokens])

  useEffect(() => {
    if (fromToken?.address === ETH_SWAPS_TOKEN_OBJECT.address && (fromToken?.balance !== ethBalance)) {
      dispatch(setSwapFromToken({ ...fromToken, balance: ethBalance, string: getValueFromWeiHex({ value: ethBalance, numberOfDecimals: 4, toDenomination: 'ETH' }) }))
    }
  }, [dispatch, fromToken, ethBalance])
  const selectedFromToken = useTokensToSearch({
    providedTokens: fromToken || fetchParamsFromToken ? [fromToken || fetchParamsFromToken] : [],
    rawEthBalance: ethBalance,
    usersTokens: memoizedUsersTokens,
    includeEth: false,
  })[0]
  const tokensToSearch = useTokensToSearch({
    rawEthBalance: ethBalance,
    usersTokens: memoizedUsersTokens,
    topTokens: topAssets,
  })
  const selectedToToken = tokensToSearch.find(({ address }) => address === toToken?.address) || toToken

  const {
    address: fromTokenAddress,
    symbol: fromTokenSymbol,
    string: fromTokenString,
    decimals: fromTokenDecimals,
  } = selectedFromToken || {}

  const prevFromTokenString = usePrevious(fromTokenString)

  useEffect(() => {
    if (prevFromTokenString !== fromTokenString) {
      onInputChange(inputValue, fromTokenString)
    }
  }, [onInputChange, prevFromTokenString, inputValue, fromTokenString])

  const [fetchedTokenExchangeRate, setFetchedTokenExchangeRate] = useState(undefined)
  const convertFromFiatValue = useTokenFiatAmount(
    fromTokenAddress,
    inputValue || 0,
    fromTokenSymbol,
    fromTokenSymbol === 'ETH' ? 1 : fetchedTokenExchangeRate,
    true,
  )

  const onFromSelect = (token) => {
    if (token && !convertFromFiatValue && fetchedTokenExchangeRate !== null) {
      fetchTokenPrice(token.address)
        .then((rate) => {
          if (rate !== null && rate !== undefined) {
            setFetchedTokenExchangeRate(rate)
          }
        })
    } else {
      setFetchedTokenExchangeRate(null)
    }
    if (token && !memoizedUsersTokens.find((usersToken) => usersToken.address === token.address)) {
      fetchTokenBalance(token.address, selectedAccountAddress)
        .then((fetchedBalance) => {
          if (fetchedBalance?.balance) {
            const balanceAsDecString = fetchedBalance.balance.toString(10)
            const balanceAsHexString = fetchedBalance.balance.toString(16)
            const userTokenBalance = calcTokenAmount(balanceAsDecString, token.decimals)
            dispatch(setSwapFromToken({ ...token, string: userTokenBalance.toString(10), balance: balanceAsHexString }))
          }
        })
    }
    dispatch(setSwapFromToken(token))
    dispatch(setMaxMode(false))
    onInputChange(inputValue, token.string, token.decimals)
  }
  const onToSelect = useCallback((token) => dispatch(setSwapToToken(token)), [dispatch])
  const hideDropdownItemIf = useCallback((item) => item.address === fromTokenAddress, [fromTokenAddress])

  useEffect(() => {
    dispatch(resetSwapsPostFetchState())
  }, [dispatch])

  return (
    <div style="build-quote">
      <div className="build-quote__content">
        <div className="build-quote__dropdown-input-pair-header">
          <div className="build-quote__input-label">{t('swapSwapFrom')}</div>
          <div
            className="build-quote__max-button"
            onClick={() => {
              dispatch(setMaxMode(true))
              onInputChange(fromTokenAddress && fromTokenString === undefined ? null : fromTokenString, fromTokenString)
            }}
          >{t('max')}
          </div>
        </div>
        <DropdownInputPair
          onSelect={onFromSelect}
          itemsToSearch={tokensToSearch}
          onInputChange={(value) => {
            dispatch(setMaxMode(false))
            onInputChange(value, fromTokenString, fromTokenDecimals)
          }}
          inputValue={inputValue}
          leftValue={inputValue && convertFromFiatValue}
          selectedItem={selectedFromToken}
          maxListItems={30}
          loading={loading && (!tokensToSearch?.length || !topAssets || !Object.keys(topAssets).length)}
          selectPlaceHolderText="Select"
          hideItemIf={(item) => item.address === selectedToToken?.address}
        />
        <div
          className={classnames('build-quote__balance-message', {
            'build-quote__balance-message--error': balanceError,
          })}
        >
          {!balanceError && selectedFromToken && t('swapYourTokenBalance', [fromTokenString || '0', fromTokenSymbol])}
          {balanceError && (
            <div className="build-quite__insufficient-funds">
              <div className="build-quite__insufficient-funds-first">{t('swapsNotEnoughForTx', [fromTokenSymbol])}</div>
              <div className="build-quite__insufficient-funds-second">{t('swapYourTokenBalance', [fromTokenString || '0', fromTokenSymbol])}</div>
            </div>
          )}
        </div>
        <div
          className="build-quote__swap-arrows-row"
          onClick={() => {
            onToSelect(selectedFromToken)
            onFromSelect(selectedToToken)
          }}
        ><div className="build-quote__swap-arrows" />
        </div>
        <div className="build-quote__dropdown-convert-to-header">
          <div className="build-quote__input-label">{t('swapSwapTo')}</div>
        </div>
        <DropdownSearchList
          startingItem={selectedToToken}
          itemsToSearch={tokensToSearch}
          openSearchListClassName="build-quote__search-token--open"
          searchPlaceholderText={t('swapSearchForAToken')}
          fuseSearchKeys={fuseSearchKeys}
          selectPlaceHolderText="Select a token"
          maxListItems={30}
          onSelect={onToSelect}
          loading={loading && (!tokensToSearch?.length || !topAssets || !Object.keys(topAssets).length)}
          externallySelectedItem={selectedToToken}
          hideItemIf={hideDropdownItemIf}
          listContainerClassName="build-quote__to-dropdown"
          hideRightLabels
          defaultToAll

        />
        <div className="build-quote__slippage-buttons-container">
          <SlippageButtons onSelect={(newSlippage) => setMaxSlippage(newSlippage)} />
        </div>
      </div>
      <SwapsFooter
        onSubmit={onSubmit}
        submitTextKey={t('swapGetQuotes')}
        hideCancel
      />
    </div>
  )
}

BuildQuote.propTypes = {
  inputValue: PropTypes.string,
  onInputChange: PropTypes.func,
  ethBalance: PropTypes.string,
  setMaxSlippage: PropTypes.func,
  onSubmit: PropTypes.func,
}
