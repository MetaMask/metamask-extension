import { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { CaipAssetType, CaipChainId, Hex } from '@metamask/utils';
import { UNKNOWN_LOCATION } from '@metamask/geolocation-controller';
import type {
  Provider,
  RampsOrder,
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
  selectRampsOrders,
  selectProviders,
  selectTokens,
  selectUserRegion,
} from '../../../selectors/rampsController';
import {
  selectIsBackupAndSyncEnabled,
  selectIsRampsSyncingEnabled,
} from '../../../selectors/identity/backup-and-sync';
import useRamps from '../useRamps/useRamps';
import {
  hasAttemptedPortfolioBuyMigration,
  hasEverConnectedToPortfolio,
  markPortfolioBuyMigrationAttempted,
} from '../utils/portfolioConnection';
import { resolveRampControllerToken } from '../utils/resolveRampControllerToken';

/**
 * A buy intent, mirroring mobile's `RampIntent` (buy-only subset).
 */
export type RampIntent = {
  /** CAIP-19 asset to pre-select, e.g. `eip155:1/erc20:0x...`. */
  assetId?: CaipAssetType;
  /** Chain for Portfolio fallback deeplinks. */
  chainId?: Hex | CaipChainId;
};

export type RampsNavigationResult = 'native' | 'portfolio' | false;

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

// Finds `assetId` in the catalog, returning the catalog's own token: caller
// ids may differ in address casing, and deep link intents use the
// `slip44:.` native placeholder vs the catalog's `slip44:{coinType}`.
function findCatalogToken(
  tokensData: TokensResponse | null,
  assetId: CaipAssetType,
): RampsToken | undefined {
  const catalog = [
    ...(tokensData?.topTokens ?? []),
    ...(tokensData?.allTokens ?? []),
  ];
  return resolveRampControllerToken(assetId, catalog);
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

async function attemptPortfolioOrderMigration({
  everConnectedToPortfolio,
  isBackupAndSyncEnabled,
  isRampsSyncingEnabled,
  rampsOrders,
  migrationRef,
  intent,
  portfolioRedirectUrl,
  openBuyCryptoInPdapp,
}: {
  everConnectedToPortfolio: boolean;
  isBackupAndSyncEnabled: boolean;
  isRampsSyncingEnabled: boolean;
  rampsOrders: RampsOrder[];
  migrationRef: { current: Promise<boolean> | null };
  intent?: RampIntent;
  portfolioRedirectUrl?: string;
  openBuyCryptoInPdapp: (chainId?: ChainId | CaipChainId) => Promise<void>;
}): Promise<boolean> {
  const shouldAttemptMigration =
    everConnectedToPortfolio &&
    isBackupAndSyncEnabled &&
    isRampsSyncingEnabled &&
    rampsOrders.length === 0;
  if (!shouldAttemptMigration) {
    return false;
  }

  const migration =
    migrationRef.current ??
    (migrationRef.current = (async () => {
      if (await hasAttemptedPortfolioBuyMigration()) {
        return false;
      }
      if (portfolioRedirectUrl) {
        await global.platform.openTab({ url: portfolioRedirectUrl });
      } else {
        await openBuyCryptoInPdapp(intent?.chainId as ChainId | CaipChainId);
      }
      // Record the attempt only after Portfolio was opened so a failed open
      // does not permanently consume the one-time migration.
      await markPortfolioBuyMigrationAttempted();
      return true;
    })());

  try {
    return await migration;
  } finally {
    if (migrationRef.current === migration) {
      migrationRef.current = null;
    }
  }
}

/**
 * Provides the `goToBuy` navigation gate for the Ramps buy entry point.
 *
 * When the flag is off, everyone is redirected to Portfolio.
 *
 * @returns An object with `goToBuy`, an async callback taking an optional
 * {@link RampIntent} and optional navigation options. It runs the gate and
 * either shows a blocking modal or opens the buy destination. Resolves to the
 * destination when it proceeded and `false` when a blocking modal was shown.
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
  const rampsOrders = useSelector(selectRampsOrders);
  const everConnectedToPortfolio = useSelector(hasEverConnectedToPortfolio);
  const isBackupAndSyncEnabled = useSelector(selectIsBackupAndSyncEnabled);
  const isRampsSyncingEnabled = useSelector(selectIsRampsSyncingEnabled);
  const portfolioMigrationRef = useRef<Promise<boolean> | null>(null);

  const goToBuy = useCallback(
    async (
      intent?: RampIntent,
      {
        replace = false,
        portfolioRedirectUrl,
      }: { replace?: boolean; portfolioRedirectUrl?: string } = {},
    ): Promise<RampsNavigationResult> => {
      // Rollout gate off → unchanged Portfolio behavior.
      if (!isEnabled) {
        // `getBuyURI` accepts any hex chain id; the narrower `ChainId` param is
        // just an over-tight annotation.
        await openBuyCryptoInPdapp(intent?.chainId as ChainId | CaipChainId);
        return 'portfolio';
      }

      // Returning Portfolio users get one migration visit before native Buy.
      // This precedes native eligibility gates because Portfolio performs the
      // migration from its app shell, independently of native Buy support.
      const didAttemptMigration = await attemptPortfolioOrderMigration({
        everConnectedToPortfolio,
        isBackupAndSyncEnabled,
        isRampsSyncingEnabled,
        rampsOrders,
        migrationRef: portfolioMigrationRef,
        intent,
        portfolioRedirectUrl,
        openBuyCryptoInPdapp,
      });
      if (didAttemptMigration) {
        return 'portfolio';
      }

      // 1. Service-disruption kill-switch for native Buy.
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

      // 4. Providers/tokens fetched but empty. A null `tokens.data` means
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
        navigate(RAMPS_TOKEN_SELECTION_ROUTE, { replace });
        return 'native';
      }

      // `tokens` isn't persisted, and setSelectedToken throws until it's fetched
      // (e.g. after an MV3 service-worker restart). The controller dedupes this
      // with RampsBootstrap's in-flight fetch.
      const fetchedTokens = tokens.data
        ? null
        : await getRampsTokens(
            userRegion?.regionCode ?? location.toLowerCase(),
            'buy',
          ).catch(() => null);

      // Resolve against the catalog. Block on one that definitively lacks or
      // does not support the token — either the rendered catalog settled
      // (checked above), or the catalog we just fetched. Otherwise fail open
      // (proceed with it selected, page re-resolves).
      const catalogToken = findCatalogToken(
        fetchedTokens ?? tokens.data,
        assetId,
      );
      if (
        (catalogData || fetchedTokens) &&
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
        replace,
      });
      return 'native';
    },
    [
      isEnabled,
      isDisruption,
      isRegionUnsupported,
      providers,
      tokens,
      userRegion,
      rampsOrders,
      everConnectedToPortfolio,
      isBackupAndSyncEnabled,
      isRampsSyncingEnabled,
      dispatch,
      navigate,
      openBuyCryptoInPdapp,
    ],
  );

  return { goToBuy, isUnifiedBuyEnabled: isEnabled };
}
