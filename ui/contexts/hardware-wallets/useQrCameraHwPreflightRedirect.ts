import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import BigNumber from 'bignumber.js';
import { BridgeQueryParams } from '../../../shared/lib/deep-links/routes/swap';
import {
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRMATION_V_NEXT_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  SWAP_PATH,
} from '../../helpers/constants/routes';
import {
  getFromAmount,
  getFromToken,
  getToToken,
} from '../../ducks/bridge/selectors';
import type { BridgeAppState } from '../../ducks/bridge/selectors';

/**
 * True when the path is a confirmation screen whose tx/message id lives in the
 * URL (and in background controllers).
 *
 * @param pathname - Current location pathname.
 * @returns Whether `pathname` is a confirmation detail route.
 */
export function isConfirmationPath(pathname: string): boolean {
  return (
    pathname.startsWith(`${CONFIRMATION_V_NEXT_ROUTE}/`) ||
    pathname.startsWith(`${CONFIRM_TRANSACTION_ROUTE}/`)
  );
}

/**
 * Resolves where side-panel QR camera preflight should open fullscreen.
 *
 * Called on the swap form or confirmation screen *before* entering the HW
 * signing page — not for mid-flow recovery.
 *
 * @param pathname - Current location pathname.
 * @returns Target route, or `null` to keep the current hash route.
 */
export function resolveQrCameraPreflightRoute(
  pathname: string,
): string | null {
  if (pathname.startsWith(CROSS_CHAIN_SWAP_ROUTE)) {
    return SWAP_PATH;
  }
  if (isConfirmationPath(pathname)) {
    return pathname;
  }
  return null;
}

/**
 * Builds the Swap / Bridge deep-link query string from explicit form state.
 *
 * @param state - Bridge app state.
 * @returns Query string, or `null` when empty / not on a swap route.
 */
export function buildBridgePreflightQueryString(
  state: BridgeAppState,
  pathname: string,
): string | null {
  if (!pathname.startsWith(CROSS_CHAIN_SWAP_ROUTE)) {
    return null;
  }

  const fromToken = getFromToken(state);
  const toToken = getToToken(state);
  const fromAmount = getFromAmount(state);
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
}

/**
 * Preflight fullscreen destination for QR camera gating in the side panel.
 *
 * @returns `{ queryString, targetRoute }` for {@link ensureQrCameraReadyForHwFlow}.
 */
export function useQrCameraHwPreflightRedirect(): {
  queryString: string | null;
  targetRoute: string | null;
} {
  const { pathname } = useLocation();
  const queryString = useSelector((state: BridgeAppState) =>
    buildBridgePreflightQueryString(state, pathname),
  );

  const targetRoute = useMemo(
    () => resolveQrCameraPreflightRoute(pathname),
    [pathname],
  );

  return { queryString, targetRoute };
}
