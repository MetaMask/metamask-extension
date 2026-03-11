import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  resetBridgeControllerAndCache,
  restoreQuoteRequestFromState,
  setFromToken,
} from '../../ducks/bridge/actions';
import { getBridgeQuotes } from '../../ducks/bridge/selectors';
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

  const { activeQuote } = useSelector(getBridgeQuotes);

  const { resetLocationState, token } = useBridgeNavigation();

  const shouldRehydrateFromLocationState = token;
  const shouldRestoreInputsFromQuote = activeQuote;

  const resetControllerAndCache = () => {
    dispatch(resetBridgeControllerAndCache());
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
