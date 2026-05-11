import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import BigNumber from 'bignumber.js';
import { BridgeQueryParams } from '../../../shared/lib/deep-links/routes/swap';
import { CROSS_CHAIN_SWAP_ROUTE } from '../../helpers/constants/routes';
import {
  getFromAmount,
  getFromToken,
  getToToken,
} from '../../ducks/bridge/selectors';
import type { BridgeAppState } from '../../ducks/bridge/selectors';

/**
 * Returns a callback that builds a query string encoding the current
 * Swap / Bridge form parameters (fromToken, toToken, amount) using the
 * deep-link {@link BridgeQueryParams} format.
 *
 * When the current route is *not* under {@link CROSS_CHAIN_SWAP_ROUTE},
 * the callback returns `null` — no query string is needed (e.g. Send
 * transactions persist via the TransactionController).
 */
export const useBridgeRedirectQueryString = (): (() => string | null) => {
  const { pathname } = useLocation();

  const fromToken = useSelector((state: BridgeAppState) => getFromToken(state));
  const toToken = useSelector((state: BridgeAppState) => getToToken(state));
  const fromAmount = useSelector((state: BridgeAppState) =>
    getFromAmount(state),
  );

  return useCallback(() => {
    if (!pathname.startsWith(CROSS_CHAIN_SWAP_ROUTE)) {
      return null;
    }

    const params = new URLSearchParams();

    if (fromToken?.assetId) {
      params.set(BridgeQueryParams.From, fromToken.assetId);
    }
    if (toToken?.assetId) {
      params.set(BridgeQueryParams.To, toToken.assetId);
    }

    // fromAmount is the display value (e.g. "1.5" ETH) but the deep-link
    // amount param expects base units (e.g. wei), because usePrefillFromSearchQuery
    // divides by 10^decimals via calcTokenAmount when restoring.
    if (fromAmount && fromToken?.decimals !== undefined) {
      const baseUnits = new BigNumber(fromAmount)
        .times(new BigNumber(10).pow(fromToken.decimals))
        .toFixed(0);
      params.set(BridgeQueryParams.Amount, baseUnits);
    }

    const queryString = params.toString();
    return queryString.length > 0 ? queryString : null;
  }, [pathname, fromToken, toToken, fromAmount]);
};
