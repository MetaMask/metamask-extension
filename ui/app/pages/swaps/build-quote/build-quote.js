import React, { useContext, useEffect, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'
import classnames from 'classnames'
import { uniqBy } from 'lodash'
import { useTokensToSearch } from '../../../hooks/useTokensToSearch'
import { useEqualityCheck } from '../../../hooks/useEqualityCheck'
import { I18nContext } from '../../../contexts/i18n'
import DropdownInputPair from '../dropdown-input-pair'
import DropdownSearchList from '../dropdown-search-list'
import SlippageButtons from '../slippage-buttons'
import { getTokens } from '../../../ducks/metamask/metamask'

import {
  setSwapsFromToken,
  setSwapToToken,
  getFromToken,
  getToToken,
  getBalanceError,
  getTopAssets,
  getFetchParams,
} from '../../../ducks/swaps/swaps'
import { getValueFromWeiHex } from '../../../helpers/utils/conversions.util'
import { calcTokenAmount } from '../../../helpers/utils/token-util'
import { usePrevious } from '../../../hooks/usePrevious'
import { useTokenTracker } from '../../../hooks/useTokenTracker'
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount'

import { ETH_SWAPS_TOKEN_OBJECT } from '../../../helpers/constants/swaps'

import { setMaxMode, resetSwapsPostFetchState, removeToken } from '../../../store/actions'
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
  onSubmit,
}) {
  const t = useContext(I18nContext)
  const dispatch = useDispatch()

  const [fetchedTokenExchangeRate, setFetchedTokenExchangeRate] = useState(undefined)

  const balanceError = useSelector(getBalanceError)
  const fetchParams = useSelector(getFetchParams)
  const { sourceTokenInfo = {}, destinationTokenInfo = {} } = fetchParams?.metaData || {}
  const tokens = useSelector(getTokens)
  const topAssets = useSelector(getTopAssets)
  const fromToken = useSelector(getFromToken)
  const toToken = useSelector(getToToken) || destinationTokenInfo
  const fetchParamsFromToken = sourceTokenInfo?.symbol === 'ETH'
    ? { ...ETH_SWAPS_TOKEN_OBJECT, string: getValueFromWeiHex({ value: ethBalance, numberOfDecimals: 4, toDenomination: 'ETH' }), balance: ethBalance }
    : sourceTokenInfo

  const { loading, tokensWithBalances } = useTokenTracker(tokens)
  const usersTokens = uniqBy([...tokensWithBalances, ...tokens], 'address')
  const memoizedUsersTokens = useEqualityCheck(usersTokens)

  const selectedFromToken = useTokensToSearch({
    providedTokens: fromToken || fetchParamsFromToken ? [fromToken || fetchParamsFromToken] : [],
    rawEthBalance: ethBalance,
    usersTokens: memoizedUsersTokens,
    onlyEth: (fromToken || fetchParamsFromToken)?.symbol === 'ETH',
    singleToken: true,
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

  const convertFromFiatValue = useTokenFiatAmount(
    fromTokenAddress,
    inputValue || 0,
    fromTokenSymbol,
    {
      exchangeRate: fromTokenSymbol === 'ETH' ? 1 : fetchedTokenExchangeRate,
      showFiat: true,
    },
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
            dispatch(setSwapsFromToken({ ...token, string: userTokenBalance.toString(10), balance: balanceAsHexString }))
          }
        })
    }
    dispatch(setSwapsFromToken(token))
    dispatch(setMaxMode(false))
    onInputChange(inputValue, token.string, token.decimals)
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

  useEffect(() => {
    if (fromToken?.address === ETH_SWAPS_TOKEN_OBJECT.address && (fromToken?.balance !== ethBalance)) {
      dispatch(setSwapsFromToken({ ...fromToken, balance: ethBalance, string: getValueFromWeiHex({ value: ethBalance, numberOfDecimals: 4, toDenomination: 'ETH' }) }))
    }
  }, [dispatch, fromToken, ethBalance])

  useEffect(() => {
    if (prevFromTokenString !== fromTokenString) {
      onInputChange(inputValue, fromTokenString)
    }
  }, [onInputChange, prevFromTokenString, inputValue, fromTokenString])

  useEffect(() => {
    dispatch(resetSwapsPostFetchState())
  }, [dispatch])

  return (
    <div className="build-quote">
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
          listContainerClassName="build-quote__open-dropdown"
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
          listContainerClassName="build-quote__open-dropdown"
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
        onSubmit={onSubmit}
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
  onSubmit: PropTypes.func,
  selectedAccountAddress: PropTypes.string,
}
