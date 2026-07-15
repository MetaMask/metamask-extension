import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { CaipAssetType, CaipChainId, Hex } from '@metamask/utils';
import { UNKNOWN_LOCATION } from '@metamask/geolocation-controller';
import type {
  Provider,
  ResourceState,
  TokensResponse,
} from '@metamask/ramps-controller';
import type { ChainId } from '../../../../shared/constants/network';
import {
  RAMPS_BUILD_QUOTE_ROUTE,
  RAMPS_TOKEN_SELECTION_ROUTE,
} from '../../../helpers/constants/routes';
import { showModal } from '../../../store/actions';
import { submitRequestToBackground } from '../../../store/background-connection';
import {
  getIsRampsEnabled,
  getIsRampsServiceDisruptionActive,
} from '../../../selectors/ramps-feature-flags';
import { getIsRampRegionUnsupported } from '../../../selectors/ramps';
import {
  selectProviders,
  selectTokens,
} from '../../../selectors/rampsController';
import useRamps from '../useRamps/useRamps';

/**
 * A buy intent, mirroring mobile's `RampIntent` (buy-only subset).
 */
export type RampIntent = {
  /** CAIP-19 asset to pre-select, e.g. `eip155:1/erc20:0x...`. */
  assetId?: CaipAssetType;
  /** Chain for the flag-off Portfolio fallback deeplink only. */
  chainId?: Hex | CaipChainId;
};

type ProvidersState = ResourceState<Provider[], Provider | null>;
type TokensState = ResourceState<TokensResponse | null, unknown>;

// Resolve geolocation on demand; a failed lookup fails closed (undefined).
async function resolveGeolocation(): Promise<string | undefined> {
  try {
    return await submitRequestToBackground<string>('getGeolocation');
  } catch {
    return undefined;
  }
}

// True once providers/tokens have finished fetching without error.
function isCatalogSettled(
  providers: ProvidersState,
  tokens: TokensState,
): boolean {
  return (
    !providers.isLoading &&
    !tokens.isLoading &&
    !providers.error &&
    !tokens.error
  );
}

// True when a settled catalog has no providers or no tokens.
function isCatalogEmpty(
  providers: ProvidersState,
  tokensData: TokensResponse,
): boolean {
  const providersEmpty = providers.data.length === 0;
  const tokensEmpty =
    (tokensData.topTokens?.length ?? 0) === 0 &&
    (tokensData.allTokens?.length ?? 0) === 0;
  return providersEmpty || tokensEmpty;
}

// True when `assetId` is present in a settled catalog and not flagged off.
function isAssetSupported(
  tokensData: TokensResponse,
  assetId: CaipAssetType,
): boolean {
  const catalog = [
    ...(tokensData.topTokens ?? []),
    ...(tokensData.allTokens ?? []),
  ];
  const match = catalog.find(
    (token) => token.assetId.toLowerCase() === assetId.toLowerCase(),
  );
  return Boolean(match) && match?.tokenSupported !== false;
}

// Pre-select the token; a failed pre-selection fails open (non-fatal).
async function preselectToken(assetId: CaipAssetType): Promise<void> {
  try {
    await submitRequestToBackground('setRampsSelectedToken', [assetId]);
  } catch {
    // Fail open — the build-quote page can re-resolve the token itself.
  }
}

/**
 * Provides the `goToBuy` navigation gate for the Ramps buy entry point.
 *
 * Runs a fixed geo-block gate (service disruption, geolocation unknown, region
 * unsupported, providers/tokens fetched-but-empty) and then routes into the
 * native buy flow: an intent with a supported `assetId` pre-selects the token
 * and opens the build-quote page; without one it opens the token-selection
 * page; an unsupported `assetId` raises the unsupported modal. The gate is
 * skipped entirely when the `rampsEnabled` rollout flag is off (unchanged
 * Portfolio redirect).
 *
 * Geolocation is resolved on demand via the background `GeolocationController`
 * (mobile parity — it does not fetch at startup, so reading synced state alone
 * would fail closed). Any loading/indeterminate state fails open; only a
 * settled, definitively-blocking state raises a modal.
 *
 * @returns An object with `goToBuy`, an async callback taking an optional
 * {@link RampIntent}. It runs the gate and either shows a blocking modal or
 * opens the buy destination. Resolves to `true` when it proceeded and `false`
 * when a blocking modal was shown, so callers can gate follow-up UI (e.g. a
 * "tab opened" toast).
 */
export default function useRampsNavigation() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { openBuyCryptoInPdapp } = useRamps();

  const isEnabled = useSelector(getIsRampsEnabled);
  const isDisruption = useSelector(getIsRampsServiceDisruptionActive);
  const isRegionUnsupported = useSelector(getIsRampRegionUnsupported);
  const providers = useSelector(selectProviders);
  const tokens = useSelector(selectTokens);

  const goToBuy = useCallback(
    async (intent?: RampIntent): Promise<boolean> => {
      // Rollout gate off → unchanged Portfolio behavior.
      if (!isEnabled) {
        // `getBuyURI` accepts any hex chain id; the narrower `ChainId` param is
        // just an over-tight annotation.
        openBuyCryptoInPdapp(intent?.chainId as ChainId | CaipChainId);
        return true;
      }

      // 1. Service-disruption kill-switch — takes precedence over everything
      // below (mobile parity).
      if (isDisruption) {
        dispatch(showModal({ name: 'RAMPS_SERVICE_DISRUPTION' }));
        return false;
      }

      // 2. Geolocation unknown. Resolve on demand via the GeolocationController
      // (it does not fetch at startup, so reading synced state alone would
      // report UNKNOWN and fail closed). A settled `UNKNOWN`/failed lookup means
      // we cannot verify the user's location → EligibilityFailed.
      const location = await resolveGeolocation();
      if (!location || location === UNKNOWN_LOCATION) {
        dispatch(showModal({ name: 'RAMPS_ELIGIBILITY_FAILED' }));
        return false;
      }

      // 3. Region definitively unsupported.
      if (isRegionUnsupported) {
        dispatch(showModal({ name: 'RAMPS_UNSUPPORTED' }));
        return false;
      }

      // 4. Providers/tokens fetched but empty. `tokens.data === null` means
      // providers/tokens haven't been fetched yet (fetched together by the
      // native flow), so fail open and skip this check entirely until then.
      // A fetch error also fails open (mobile parity) — an empty result only
      // counts once the catalog has actually settled, not on a failed fetch.
      const catalogSettled = isCatalogSettled(providers, tokens);
      const catalogData = catalogSettled ? tokens.data : null;
      if (catalogData && isCatalogEmpty(providers, catalogData)) {
        dispatch(showModal({ name: 'RAMPS_UNSUPPORTED' }));
        return false;
      }

      // 5. Route into the native buy flow.
      const assetId = intent?.assetId;
      if (!assetId) {
        // No specific asset → token selection page.
        navigate(RAMPS_TOKEN_SELECTION_ROUTE);
        return true;
      }

      // Resolve against the catalog. Only block on a settled catalog that
      // definitively lacks/unsupports the token — an unsettled catalog fails
      // open (proceed with it selected, page re-resolves).
      if (catalogData && !isAssetSupported(catalogData, assetId)) {
        dispatch(showModal({ name: 'RAMPS_UNSUPPORTED' }));
        return false;
      }
      await preselectToken(assetId);
      navigate(RAMPS_BUILD_QUOTE_ROUTE);
      return true;
    },
    [
      isEnabled,
      isDisruption,
      isRegionUnsupported,
      providers,
      tokens,
      dispatch,
      navigate,
      openBuyCryptoInPdapp,
    ],
  );

  // Expose the rollout flag so callers can gate follow-up UI (e.g. the flag-off
  // "tab opened" toast) without re-reading the selector themselves.
  return { goToBuy, isRampsEnabled: isEnabled };
}
