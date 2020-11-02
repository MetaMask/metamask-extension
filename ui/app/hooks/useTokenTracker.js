import { useState, useEffect, useRef, useCallback } from 'react'
import TokenTracker from '@metamask/eth-token-tracker'
import { useSelector } from 'react-redux'
import { getCurrentNetwork, getSelectedAddress } from '../selectors'
import { useEqualityCheck } from './useEqualityCheck'

export function useTokenTracker(tokens) {
  const network = useSelector(getCurrentNetwork)
  const userAddress = useSelector(getSelectedAddress)

  const [loading, setLoading] = useState(() => tokens?.length >= 0)
  const [tokensWithBalances, setTokensWithBalances] = useState([])
  const [error, setError] = useState(null)
  const tokenTracker = useRef(null)
  const memoizedTokens = useEqualityCheck(tokens)

  const updateBalances = useCallback((tokenWithBalances) => {
    setTokensWithBalances(tokenWithBalances)
    setLoading(false)
    setError(null)
  }, [])

  const showError = useCallback((err) => {
    setError(err)
    setLoading(false)
  }, [])

  const teardownTracker = useCallback(() => {
    if (tokenTracker.current) {
      tokenTracker.current.stop()
      tokenTracker.current.removeAllListeners('update')
      tokenTracker.current.removeAllListeners('error')
      tokenTracker.current = null
    }
  }, [])

  const buildTracker = useCallback(
    (address, tokenList) => {
      // clear out previous tracker, if it exists.
      teardownTracker()
      tokenTracker.current = new TokenTracker({
        userAddress: address,
        provider: global.ethereumProvider,
        tokens: tokenList,
        pollingInterval: 8000,
      })

      tokenTracker.current.on('update', updateBalances)
      tokenTracker.current.on('error', showError)
      tokenTracker.current.updateBalances()
    },
    [updateBalances, showError, teardownTracker],
  )

  // Effect to remove the tracker when the component is removed from DOM
  // Do not overload this effect with additional dependencies. teardownTracker
  // is the only dependency here, which itself has no dependencies and will
  // never update. The lack of dependencies that change is what confirms
  // that this effect only runs on mount/unmount
  useEffect(() => {
    return teardownTracker
  }, [teardownTracker])

  // Effect to set loading state and initialize tracker when values change
  useEffect(() => {
    // This effect will only run initially and when:
    // 1. network is updated,
    // 2. userAddress is changed,
    // 3. token list is updated and not equal to previous list
    // in any of these scenarios, we should indicate to the user that their token
    // values are in the process of updating by setting loading state.
    setLoading(true)

    if (!userAddress || network === 'loading' || !global.ethereumProvider) {
      // If we do not have enough information to build a TokenTracker, we exit early
      // When the values above change, the effect will be restarted. We also teardown
      // tracker because inevitably this effect will run again momentarily.
      teardownTracker()
      return
    }

    if (memoizedTokens.length === 0) {
      // sets loading state to false and token list to empty
      updateBalances([])
    }

    buildTracker(userAddress, memoizedTokens)
  }, [
    userAddress,
    teardownTracker,
    network,
    memoizedTokens,
    updateBalances,
    buildTracker,
  ])

  return { loading, tokensWithBalances, error }
}
