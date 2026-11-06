import { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { CaipAssetType, CaipChainId, Hex } from '@metamask/utils';
import { UNKNOWN_LOCATION } from '@metamask/geolocation-controller';
import type {
  Country,
  Provider,
  RampsOrder,
  RampsToken,
  ResourceState,
  TokensResponse,
  UserRegion,
} from '@metamask/ramps-controller';
import type { ChainId } from '../../../../shared/constants/network';
import {
  RAMPS_BUILD_QUOTE_ROUTE,
  RAMPS_TOKEN_SELECTION_ROUTE,
} from '../../../helpers/constants/routes';
import { showModal } from '../../../store/actions';
import { submitRequestToBackground } from '../../../store/background-connection';
import {
  getRampsCountries,
  getRampsTokens,
  setRampsUserRegion,
} from '../../../store/controller-actions/ramps-controller';
import { getIsRampsServiceDisruptionActive } from '../../../selectors/ramps-feature-flags';
import { getIsRampRegionUnsupported } from '../../../selectors/ramps';
import {
  selectCountries,
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

type BuyBlockingModal =
  | 'RAMPS_SERVICE_DISRUPTION'
  | 'RAMPS_ELIGIBILITY_FAILED'
  | 'RAMPS_UNSUPPORTED';

type BuyGateResult =
  | { blocker: BuyBlockingModal }
  | { blocker: null; location: string };

async function getBuyGate({
  isDisruption,
  isRegionUnsupported,
}: {
  isDisruption: boolean;
  isRegionUnsupported: boolean;
}): Promise<BuyGateResult> {
  if (isDisruption) {
    return { blocker: 'RAMPS_SERVICE_DISRUPTION' };
  }

  const location = await resolveGeolocation();
  if (!location || location === UNKNOWN_LOCATION) {
    return { blocker: 'RAMPS_ELIGIBILITY_FAILED' };
  }

  if (isRegionUnsupported) {
    return { blocker: 'RAMPS_UNSUPPORTED' };
  }

  return { blocker: null, location };
}

function getSettledCatalogData(
  providers: ProvidersState,
  tokens: TokensState,
): TokensResponse | null {
  return isCatalogSettled(providers, tokens) ? tokens.data : null;
}

async function fetchTokensForIntent({
  tokens,
  userRegion,
  countries,
  location,
}: {
  tokens: TokensState;
  userRegion: UserRegion | null;
  countries: ResourceState<Country[]>;
  location: string;
}): Promise<TokensResponse | null> {
  if (tokens.data) {
    return null;
  }

  let region = userRegion?.regionCode;
  if (!region) {
    if (!countries.data?.length) {
      // `setUserRegion` needs the countries catalog, which a fresh install may
      // not have loaded yet (countries are not persisted).
      await getRampsCountries().catch(() => null);
    }
    region = (await setRampsUserRegion(location).catch(() => null))?.regionCode;
  }

  return region ? getRampsTokens(region, 'buy').catch(() => null) : null;
}

async function runPortfolioMigrationOnce({
  everConnectedToPortfolio,
  isBackupAndSyncEnabled,
  isRampsSyncingEnabled,
  rampsOrders,
  portfolioMigrationRef,
  openPortfolio,
}: {
  everConnectedToPortfolio: boolean;
  isBackupAndSyncEnabled: boolean;
  isRampsSyncingEnabled: boolean;
  rampsOrders: RampsOrder[];
  portfolioMigrationRef: { current: Promise<boolean> | null };
  openPortfolio: () => Promise<unknown>;
}): Promise<boolean> {
  if (
    !everConnectedToPortfolio ||
    !isBackupAndSyncEnabled ||
    !isRampsSyncingEnabled ||
    rampsOrders.length > 0
  ) {
    return false;
  }

  const migration =
    portfolioMigrationRef.current ??
    (portfolioMigrationRef.current = (async () => {
      if (await hasAttemptedPortfolioBuyMigration()) {
        return false;
      }
      await openPortfolio();
      // Record the attempt only after Portfolio was opened so a failed open
      // does not permanently consume the one-time migration.
      await markPortfolioBuyMigrationAttempted();
      return true;
    })());

  try {
    return await migration;
  } finally {
    if (portfolioMigrationRef.current === migration) {
      portfolioMigrationRef.current = null;
    }
  }
}

async function navigateToNativeBuy({
  intent,
  replace,
  tokens,
  fetchedTokens,
  catalogData,
  dispatch,
  navigate,
}: {
  intent?: RampIntent;
  replace: boolean;
  tokens: TokensState;
  fetchedTokens: TokensResponse | null;
  catalogData: TokensResponse | null;
  dispatch: ReturnType<typeof useDispatch>;
  navigate: ReturnType<typeof useNavigate>;
}): Promise<RampsNavigationResult> {
  const assetId = intent?.assetId;
  if (!assetId) {
    navigate(RAMPS_TOKEN_SELECTION_ROUTE, { replace });
    return 'native';
  }

  const catalogToken = findCatalogToken(fetchedTokens ?? tokens.data, assetId);
  if (
    (catalogData || fetchedTokens) &&
    (!catalogToken || catalogToken.tokenSupported === false)
  ) {
    dispatch(showModal({ name: 'RAMPS_UNSUPPORTED' }));
    return false;
  }

  const selectedAssetId =
    (catalogToken?.assetId as CaipAssetType | undefined) ?? assetId;
  if (!(await preselectToken(selectedAssetId))) {
    dispatch(showModal({ name: 'RAMPS_UNSUPPORTED' }));
    return false;
  }

  navigate(RAMPS_BUILD_QUOTE_ROUTE, {
    state: { assetId: selectedAssetId },
    replace,
  });
  return 'native';
}

/**
 * Provides the `goToBuy` gate for the Ramps buy entry point.
 *
 * @returns `goToBuy`, which shows a blocking modal or opens the buy
 * destination, resolving to the destination or `false` when blocked.
 */
export default function useRampsNavigation() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { openBuyCryptoInPdapp } = useRamps();

  const isDisruption = useSelector(getIsRampsServiceDisruptionActive);
  const isRegionUnsupported = useSelector(getIsRampRegionUnsupported);
  const providers = useSelector(selectProviders);
  const tokens = useSelector(selectTokens);
  const rampsOrders = useSelector(selectRampsOrders);
  const userRegion = useSelector(selectUserRegion);
  const countries = useSelector(selectCountries);
  const everConnectedToPortfolio = useSelector(hasEverConnectedToPortfolio);
  const isBackupAndSyncEnabled = useSelector(selectIsBackupAndSyncEnabled);
  const isRampsSyncingEnabled = useSelector(selectIsRampsSyncingEnabled);
  const portfolioMigrationRef = useRef<Promise<boolean> | null>(null);

  const goToBuy = useCallback(
    async (
      intent?: RampIntent,
      // `replace` swaps the history entry; `portfolioRedirectUrl` preserves
      // the `/buy` params when the buy opens Portfolio instead.
      {
        replace = false,
        portfolioRedirectUrl,
      }: { replace?: boolean; portfolioRedirectUrl?: string } = {},
    ): Promise<RampsNavigationResult> => {
      const openPortfolio = () =>
        portfolioRedirectUrl
          ? global.platform.openTab({ url: portfolioRedirectUrl })
          : openBuyCryptoInPdapp(intent?.chainId as ChainId | CaipChainId);

      if (
        await runPortfolioMigrationOnce({
          everConnectedToPortfolio,
          isBackupAndSyncEnabled,
          isRampsSyncingEnabled,
          rampsOrders,
          portfolioMigrationRef,
          openPortfolio,
        })
      ) {
        return 'portfolio';
      }

      const gate = await getBuyGate({ isDisruption, isRegionUnsupported });
      if (gate.blocker) {
        dispatch(showModal({ name: gate.blocker }));
        return false;
      }

      const catalogData = getSettledCatalogData(providers, tokens);
      if (catalogData && isCatalogEmpty(providers, catalogData)) {
        dispatch(showModal({ name: 'RAMPS_UNSUPPORTED' }));
        return false;
      }

      // Only an intent needs the catalog before navigating; without one the
      // token-selection page hydrates itself.
      const fetchedTokens = intent?.assetId
        ? await fetchTokensForIntent({
            tokens,
            userRegion,
            countries,
            location: gate.location,
          })
        : null;

      return navigateToNativeBuy({
        intent,
        replace,
        tokens,
        fetchedTokens,
        catalogData,
        dispatch,
        navigate,
      });
    },
    [
      isDisruption,
      isRegionUnsupported,
      providers,
      tokens,
      rampsOrders,
      userRegion,
      countries,
      everConnectedToPortfolio,
      isBackupAndSyncEnabled,
      isRampsSyncingEnabled,
      dispatch,
      navigate,
      openBuyCryptoInPdapp,
    ],
  );

  return { goToBuy };
}
