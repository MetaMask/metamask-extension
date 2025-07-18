import { useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import {
  getIsUnifiedUIEnabled,
  getIsSwap,
  type BridgeAppState,
} from '../../../ducks/bridge/selectors';
import { getMultichainIsSolana } from '../../../selectors/multichain';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';
import { BridgeQueryParams } from '../../../../shared/lib/deep-links/routes/swap';

/*
 * This returns true if the url contains swaps=true and the current chain is solana
 * This is used to determine if the user navigated to the bridge page
 * using the Swap or Bridge button
 *
 * This appends the swaps=true query param to the url if it is not already set
 * and the current quoteRequest is a solana swap
 */
export const useIsMultichainSwap = () => {
  const { search, pathname } = useLocation();
  const history = useHistory();

  const isSolana = useSelector(getMultichainIsSolana);

  // Unified-UI feature-flag check
  const chainId = useSelector(getCurrentChainId);
  const isUnifiedUIEnabled = useSelector((state: BridgeAppState) =>
    getIsUnifiedUIEnabled(state, chainId),
  );

  const isQuoteRequestSwap = useSelector(getIsSwap);

  useEffect(() => {
    const searchParams = new URLSearchParams(search);
    const isSwapQueryParamSet =
      searchParams.get(BridgeQueryParams.SWAPS) === 'true';
    if (
      isQuoteRequestSwap &&
      (isSolana || isUnifiedUIEnabled) &&
      !isSwapQueryParamSet
    ) {
      searchParams.set(BridgeQueryParams.SWAPS, 'true');
      history.replace({
        pathname,
        search: searchParams.toString(),
      });
    }
  }, [
    isQuoteRequestSwap,
    isSolana,
    isUnifiedUIEnabled,
    history,
    search,
    pathname,
  ]);

  const isSolanaSwap = useMemo(() => {
    const searchParams = new URLSearchParams(search);
    const isSwapQueryParamSet =
      searchParams.get(BridgeQueryParams.SWAPS) === 'true';

    return isSwapQueryParamSet && (isSolana || isUnifiedUIEnabled);
  }, [isSolana, isUnifiedUIEnabled, search]);

  return isSolanaSwap;
};
