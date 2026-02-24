import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { isCrossChain } from '@metamask/bridge-controller';
import {
  resetBridgeControllerAndCache,
  restoreQuoteRequestFromState,
  setEvmBalances,
  setFromToken,
} from '../../ducks/bridge/actions';
import { getBridgeQuotes, getFromToken } from '../../ducks/bridge/selectors';
import { getMultichainCurrentChainId } from '../../selectors/multichain';
import { useBridgeNavigation } from './useBridgeNavigation';

/**
 * This sets the inital state of the bridge page on load.
 * It can either set the bridge fromToken and toToken based on the bridge redux state,
 * rehydrate the bridge store from location state,
 * restore the active quote from the bridge controller state,
 * or reset the bridge controller state and inputs.
 */
export const usePrefillFromBridgeState = () => {
  const dispatch = useDispatch();
  const fromToken = useSelector(getFromToken);

  /**
   * @deprecated remove this when GNS references are removed
   */
  const currentChainId = useSelector(getMultichainCurrentChainId);
  const { activeQuote } = useSelector(getBridgeQuotes);

  const { resetLocationState, token } = useBridgeNavigation();

  // Set src chain balances when the fromToken changes and after the token object is applied
  useEffect(() => {
    if (
      isCrossChain(fromToken.chainId, currentChainId) ||
      (token && token.assetId.toLowerCase() === fromToken.assetId.toLowerCase())
    ) {
      return;
    }
    if (fromToken?.assetId) {
      dispatch(setEvmBalances(fromToken.assetId));
    }
  }, [fromToken.assetId, currentChainId, token]);

  const shouldRehydrateFromLocationState = token;
  const shouldRestoreInputsFromQuote = activeQuote;

  const resetControllerAndCache = async () => {
    await dispatch(resetBridgeControllerAndCache());
  };

  useEffect(() => {
    if (shouldRehydrateFromLocationState) {
      // If token object is passed through navigation options, use it as the fromToken
      dispatch(setFromToken(token));
      // Clear location state after using it to prevent infinite re-renders
      resetLocationState();
    } else if (shouldRestoreInputsFromQuote) {
      dispatch(restoreQuoteRequestFromState(activeQuote.quote));
    } else {
      // Reset controller and cache on load if there's no restored active quote or token object
      resetControllerAndCache();
    }

    // Reset controller and inputs before unloading the page
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    window.addEventListener('beforeunload', resetControllerAndCache);
    return () => {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      window.removeEventListener('beforeunload', resetControllerAndCache);
    };
  }, []);
};
