import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { ENVIRONMENT_TYPE_POPUP } from '../../../shared/constants/app';
import { getEnvironmentType } from '../../../shared/lib/environment-type';
import {
  rehydrateBridgeStore,
  resetBridgeController,
  resetInputFields,
  restoreQuoteRequestFromState,
  setFromToken,
  setToToken,
} from '../../ducks/bridge/actions';
import { getBridgeQuotes, getFromChains } from '../../ducks/bridge/selectors';
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
  const fromChains = useSelector(getFromChains);

  const { resetLocationState, token, bridgeState } = useBridgeNavigation();

  const shouldRehydrateFromLocationState = bridgeState || token;
  const envType = getEnvironmentType();
  const isPopup = envType === ENVIRONMENT_TYPE_POPUP;
  const shouldRestoreInputsFromQuote = !bridgeState && activeQuote && isPopup;

  const resetControllerAndCache = () => {
    dispatch(resetBridgeController());
    dispatch(resetInputFields());
  };

  useEffect(() => {
    if (shouldRehydrateFromLocationState) {
      bridgeState &&
        dispatch(
          rehydrateBridgeStore({
            bridgeState,
          }),
        );

      // If token object is passed through navigation options, use it
      if (token) {
        const isInitialBridgeNavigation =
          !bridgeState?.isSrcAssetPickerOpen &&
          !bridgeState?.isDestAssetPickerOpen;
        const isTokenOnEnabledChain = fromChains.some(
          (chain) =>
            formatChainIdToCaip(chain.chainId) ===
            formatChainIdToCaip(token.chainId),
        );
        const shouldSetFromToken =
          bridgeState?.isSrcAssetPickerOpen ||
          (isInitialBridgeNavigation && isTokenOnEnabledChain);
        const shouldSetToToken = bridgeState?.isDestAssetPickerOpen;

        if (shouldSetFromToken) {
          dispatch(setFromToken(token));
        } else if (shouldSetToToken) {
          dispatch(setToToken(token));
        }
      }

      // Clear location state after using it to prevent infinite re-renders
      resetLocationState();
    } else if (shouldRestoreInputsFromQuote) {
      dispatch(restoreQuoteRequestFromState(activeQuote));
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
