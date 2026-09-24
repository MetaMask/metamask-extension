import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { CaipAssetType, CaipChainId, Hex } from '@metamask/utils';
import { UNKNOWN_LOCATION } from '@metamask/geolocation-controller';
import type {
  Provider,
  RampsToken,
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
import { getRampsTokens } from '../../../store/controller-actions/ramps-controller';
import {
  getIsRampsEnabled,
  getIsRampsServiceDisruptionActive,
} from '../../../selectors/ramps-feature-flags';
import { getIsRampRegionUnsupported } from '../../../selectors/ramps';
import {
  selectProviders,
  selectTokens,
  selectUserRegion,
} from '../../../selectors/rampsController';
import useRamps from '../useRamps/useRamps';
import { hasEverConnectedToPortfolio } from '../utils/portfolioConnection';
import { normalizeAssetIdForApi } from '../utils/normalizeAssetIdForApi';
import { resolveRampControllerAssetId } from '../utils/resolveRampControllerAssetId';

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
    !tokens.error &&
    tokens.data !== null &&
    Array.isArray(tokens.data.topTokens) &&
    Array.isArray(tokens.data.allTokens)
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

// Finds `assetId` in the catalog, resolving it to the catalog's canonical
// spelling: caller ids may differ in address casing, and deep link intents
// use the `slip44:.` native placeholder vs the catalog's `slip44:{coinType}`.
function findCatalogToken(
  tokensData: TokensResponse | null,
  assetId: CaipAssetType,
): RampsToken | undefined {
  const catalog = [
    ...(tokensData?.topTokens ?? []),
    ...(tokensData?.allTokens ?? []),
  ];
  const canonicalAssetId = resolveRampControllerAssetId(assetId, catalog);
  return catalog.find(
    (token) =>
      normalizeAssetIdForApi(token.assetId) ===
      normalizeAssetIdForApi(canonicalAssetId),
  );
}

// Pre-select the token before navigating to build-quote. Fail closed so a
// failed selection does not leave build-quote waiting on an unmet intent.
async function preselectToken(assetId: CaipAssetType): Promise<boolean> {
  try {
    await submitRequestToBackground('setRampsSelectedToken', [assetId]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Provides the `goToBuy` navigation gate for the Ramps buy entry point.
 *
 * When `rampsEnabled` is on:
 * - Wallets that have never connected to Portfolio use in-app Buy (geo gates).
 * - Wallets that have connected to Portfolio open Portfolio (hedge while
 * order-history Profile Sync is still rolling out; returning buyers keep
 * Portfolio until migration lands).
 *
 * When the flag is off, everyone is redirected to Portfolio.
 *
 * @returns An object with `goToBuy`, an async callback taking an optional
 * {@link RampIntent}. It runs the gate and either shows a blocking modal or
 * opens the buy destination. Resolves to `true` when it proceeded and `false`
 * when a blocking modal was shown, plus `opensBuyInPortfolioTab` so callers can
 * gate follow-up UI (e.g. a "tab opened" toast).
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
  const userRegion = useSelector(selectUserRegion);
  const everConnectedToPortfolio = useSelector(hasEverConnectedToPortfolio);

  const goToBuy = useCallback(
    async (intent?: RampIntent): Promise<boolean> => {
      // Rollout gate off → unchanged Portfolio behavior.
      if (!isEnabled) {
        // `getBuyURI` accepts any hex chain id; the narrower `ChainId` param is
        // just an over-tight annotation.
        openBuyCryptoInPdapp(intent?.chainId as ChainId | CaipChainId);
        return true;
      }

      // Returning Portfolio users → Portfolio (not in-app) until Profile Sync
      // migration can flip them onto native Buy.
      if (everConnectedToPortfolio) {
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

      // 4. Cold catalog: `tokens` is not persisted, so after an MV3
      // service-worker restart (the normal state when someone clicks a `/buy`
      // link from email) `tokens.data` is `null`, and the controller's
      // `setSelectedToken` throws until tokens are fetched. Fetch them before
      // gating or preselecting — preferring the persisted region the
      // controller gates its state writes on, falling back to the freshly
      // resolved geolocation.
      const assetId = intent?.assetId;
      let tokensState: TokensState = tokens;
      if (assetId && !tokens.data) {
        try {
          const fetchedTokens = await getRampsTokens(
            userRegion?.regionCode ?? location,
            'buy',
          );
          if (fetchedTokens) {
            tokensState = {
              data: fetchedTokens,
              selected: null,
              isLoading: false,
              error: null,
            };
          }
        } catch {
          // Failed fetch: keep the rendered (unsettled) token state below and
          // fail open, as before.
        }
      }

      // 5. Providers/tokens fetched but empty. A null `tokensState.data` means
      // providers/tokens haven't been fetched yet (fetched together by the
      // native flow), so fail open and skip this check entirely until then.
      // A fetch error also fails open (mobile parity) — an empty result only
      // counts once the catalog has actually settled, not on a failed fetch.
      const catalogSettled = isCatalogSettled(providers, tokensState);
      const catalogData = catalogSettled ? tokensState.data : null;
      if (catalogData && isCatalogEmpty(providers, catalogData)) {
        dispatch(showModal({ name: 'RAMPS_UNSUPPORTED' }));
        return false;
      }

      // 6. Route into the native buy flow.
      if (!assetId) {
        // No specific asset → token selection page (it loads the catalog).
        navigate(RAMPS_TOKEN_SELECTION_ROUTE);
        return true;
      }

      // Resolve against the catalog. Only block on a settled catalog that
      // definitively lacks/unsupports the token — an unsettled catalog fails
      // open (proceed with it selected, page re-resolves).
      const catalogToken = findCatalogToken(tokensState.data, assetId);
      if (
        catalogData &&
        (!catalogToken || catalogToken.tokenSupported === false)
      ) {
        dispatch(showModal({ name: 'RAMPS_UNSUPPORTED' }));
        return false;
      }

      // `setSelectedToken` looks the token up by exact assetId, so pre-select
      // with the catalog's own spelling rather than the caller's checksummed
      // one. Without a catalog to resolve against, the intent is all we have.
      const selectedAssetId =
        (catalogToken?.assetId as CaipAssetType | undefined) ?? assetId;
      const didPreselect = await preselectToken(selectedAssetId);
      if (!didPreselect) {
        dispatch(showModal({ name: 'RAMPS_UNSUPPORTED' }));
        return false;
      }
      navigate(RAMPS_BUILD_QUOTE_ROUTE, {
        state: { assetId: selectedAssetId },
      });
      return true;
    },
    [
      isEnabled,
      isDisruption,
      isRegionUnsupported,
      providers,
      tokens,
      userRegion,
      everConnectedToPortfolio,
      dispatch,
      navigate,
      openBuyCryptoInPdapp,
    ],
  );

  // Expose whether Buy leaves the extension so callers can gate follow-up UI
  // (e.g. the "tab opened" toast) without re-deriving the destination.
  return {
    goToBuy,
    opensBuyInPortfolioTab: !isEnabled || everConnectedToPortfolio,
  };
}
