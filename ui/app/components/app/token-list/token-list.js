import React, { useContext, useEffect, useRef, useState } from 'react'
import TokenTracker from 'eth-token-tracker'
import { useSelector } from 'react-redux'
import { isEqual } from 'lodash'
import contracts from 'eth-contract-metadata'

import { I18nContext } from '../../../contexts/i18n'
import { getSelectedAddress } from '../../../selectors/selectors'
import usePrevious from '../../../hooks/usePrevious'
import TokenCell from '../token-cell'

const defaultTokens = []
for (const address in contracts) {
  const contract = contracts[address]
  if (contract.erc20) {
    contract.address = address
    defaultTokens.push(contract)
  }
}

const stopTokenTracker = (tokenTracker) => {
  if (tokenTracker) {
    tokenTracker.stop()
    tokenTracker.removeAllListeners('update')
    tokenTracker.removeAllListeners('error')
  }
}

const constructTokenTracker = ({
  error,
  network,
  tokens,
  userAddress,
  setError,
  setTokensLoading,
  setTokensWithBalances,
}) => {
  if (!tokens || !tokens.length) {
    setTokensWithBalances([])
    setTokensLoading(false)
    return
  }
  setTokensLoading(true)

  if (!userAddress || network === 'loading' || !global.ethereumProvider) {
    return
  }

  const updateBalances = (tokensWithBalances) => {
    setTokensWithBalances(tokensWithBalances)
    if (error) {
      setError(null)
    }
    setTokensLoading(false)
  }
  const showError = (error) => {
    setError(error)
    setTokensLoading(false)
  }

  const tokenTracker = new TokenTracker({
    userAddress,
    provider: global.ethereumProvider,
    tokens: tokens,
    pollingInterval: 8000,
  })

  tokenTracker.on('update', updateBalances)
  tokenTracker.on('error', showError)
  tokenTracker.updateBalances()
  return tokenTracker
}

const TokenList = () => {
  const [tokensWithBalances, setTokensWithBalances] = useState([])
  const [error, setError] = useState(null)
  const [tokensLoading, setTokensLoading] = useState(false)

  const network = useSelector((state) => state.metamask.network)
  // use `isEqual` comparison function because the token array is serialized from the background
  // so it has a new reference with each background update, even if the tokens haven't changed
  const tokens = useSelector((state) => state.metamask.tokens, isEqual)
  const userAddress = useSelector(getSelectedAddress)
  const assetImages = useSelector((state) => state.metamask.assetImages)

  const t = useContext(I18nContext)

  const tokenTrackerRef = useRef({})
  const prevTrackerParams = usePrevious({ network, tokens, userAddress })

  // initial tracker setup and final teardown
  useEffect(() => {
    tokenTrackerRef.current = constructTokenTracker({
      error,
      network,
      tokens,
      userAddress,
      setError,
      setTokensLoading,
      setTokensWithBalances,
    })
    return stopTokenTracker.bind(null, tokenTrackerRef.current)
  }, [])

  // rebuild tracker if tracker parameters change
  useEffect(() => {
    if (
      !prevTrackerParams ||
      (
        isEqual(tokens, prevTrackerParams.tokens) &&
        userAddress === prevTrackerParams.userAddress &&
        network === prevTrackerParams.network
      )
    ) {
      return
    }

    stopTokenTracker(tokenTrackerRef.current)
    tokenTrackerRef.current = constructTokenTracker({
      error,
      network,
      tokens,
      userAddress,
      setError,
      setTokensLoading,
      setTokensWithBalances,
    })
  }, [network, tokens, userAddress])

  if (network === 'loading' || tokensLoading) {
    return (
      <div
        style={{
          display: 'flex',
          height: '250px',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '30px',
        }}
      >
        {t('loadingTokens')}
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="hotFix"
        style={{
          padding: '80px',
        }}
      >
        {t('troubleTokenBalances')}
        <span
          className="hotFix"
          style={{
            color: 'rgba(247, 134, 28, 1)',
            cursor: 'pointer',
          }}
          onClick={() => {
            global.platform.openWindow({
              url: `https://ethplorer.io/address/${userAddress}`,
            })
          }}
        >
          {t('here')}
        </span>
      </div>
    )
  }

  return (
    <div>
      {tokensWithBalances.map((tokenData, index) => {
        tokenData.image = assetImages[tokenData.address]
        return (
          <TokenCell key={index} {...tokenData} />
        )
      })}
    </div>
  )
}

export default TokenList
