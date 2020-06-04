import { useState, useEffect, useRef, useCallback } from 'react'
import TokenTracker from '@metamask/eth-token-tracker'
import { isEqual } from 'lodash'
import { useSelector } from 'react-redux'
import { getCurrentNetwork, getSelectedAddress } from '../selectors'
import { getTokens } from '../ducks/metamask/metamask'


export function useTokenTracker () {
  const network = useSelector(getCurrentNetwork)
  const userAddress = useSelector(getSelectedAddress)
  // use `isEqual` comparison function because the token array is serialized
  // from the background so it has a new reference with each background update,
  // even if the tokens haven't changed
  const tokens = useSelector(getTokens, isEqual)

  const [loading, setLoading] = useState(() => tokens?.length >= 0)
  const [tokensWithBalances, setTokensWithBalances] = useState([])
  const [error, setError] = useState(null)
  const tokenTracker = useRef(null)

  const updateBalances = useCallback((tokensWithBalances) => {
    setTokensWithBalances(tokensWithBalances)
    setLoading(false)
    setError(null)
  }, [])

  const showError = useCallback((error) => {
    setError(error)
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

  const buildTracker = useCallback((address, tokenList) => {
    // clear out previous tracker, if it exists.
    teardownTracker()
    if (!tokenTracker.current) {
      tokenTracker.current = new TokenTracker({
        userAddress: address,
        provider: global.ethereumProvider,
        tokens: tokenList,
        pollingInterval: 8000,
      })

      tokenTracker.current.on('update', updateBalances)
      tokenTracker.current.on('error', showError)
      tokenTracker.current.updateBalances()
    }
  }, [updateBalances, showError, teardownTracker])

  // Effect to remove the tracker when the component is removed from DOM
  // Do not overload this effect with additional dependencies, the fact
  // that it has an empty dependency array is what confirms it will only
  // run on mount/unmount
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
    // Due to the nature of render reconciliation in cases where an immediate
    // update to setLoading(true) would result in no UI loading screen rendered
    setLoading(true)

    if (!userAddress || network === 'loading' || !global.ethereumProvider) {
      // If we do not have enough information to build a TokenTracker, we exit early
      // When the values above change, the effect will be restarted
      return
    }

    if (tokens.length === 0) {
      // sets loading state to false and token list to empty
      updateBalances([])
    }

    buildTracker(userAddress, tokens)
  }, [userAddress, network, tokens, buildTracker])

  return { loading, tokensWithBalances, error }
}
