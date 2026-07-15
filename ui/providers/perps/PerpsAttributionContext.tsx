import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { PerpsAttributionContext as ControllerAttributionContext } from '@metamask/perps-controller';
import type { Json } from '@metamask/utils';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../shared/constants/perps-events';
import { captureException } from '../../../shared/lib/sentry';
import { submitRequestToBackground } from '../../store/background-connection';

export type PerpsFlowAttribution = {
  entryPoint?: string;
  discoverySource?: string;
  perpDiscoverySource?: string;
};

type PerpsAttributionContextValue = {
  flowAttribution: PerpsFlowAttribution;
  setFlowAttribution: (next: Partial<PerpsFlowAttribution>) => void;
  clearFlowAttribution: () => void;
  syncUtmAttributionFromSearch: (search: string) => void;
  /**
   * UTM attribution mirrored client-side (keyed by PERPS_EVENT_PROPERTY) plus a
   * `source: deeplink` value when the flow was entered via a deeplink. Merged
   * into every client-emitted PERPS_SCREEN_VIEWED event so UTM/deeplink
   * attribution reaches MetaMetrics from the client path.
   */
  screenViewedAttribution: Record<string, Json>;
};

// Exported so `usePerpsEventTracking` can read attribution without throwing when
// a call site is not wrapped by the provider (e.g. the compliance banner).
export const PerpsAttributionReactContext =
  createContext<PerpsAttributionContextValue | null>(null);

function parseUtmAttribution(
  search: string,
): ControllerAttributionContext | null {
  const params = new URLSearchParams(search);
  const context: ControllerAttributionContext = {};
  const utmSource = params.get('utm_source');
  const utmMedium = params.get('utm_medium');
  const utmCampaign = params.get('utm_campaign');
  const utmContent = params.get('utm_content');
  const utmTerm = params.get('utm_term');

  if (utmSource) {
    context.utmSource = utmSource;
  }
  if (utmMedium) {
    context.utmMedium = utmMedium;
  }
  if (utmCampaign) {
    context.utmCampaign = utmCampaign;
  }
  if (utmContent) {
    context.utmContent = utmContent;
  }
  if (utmTerm) {
    context.utmTerm = utmTerm;
  }

  return Object.keys(context).length > 0 ? context : null;
}

function mapSourceParamToDiscovery(source: string | null): string | undefined {
  if (!source) {
    return undefined;
  }
  switch (source) {
    case 'market_list':
      return PERPS_EVENT_VALUE.SOURCE.MARKET_LIST;
    case 'asset_details':
      return PERPS_EVENT_VALUE.SOURCE.ASSET_DETAILS;
    case 'trading':
      return PERPS_EVENT_VALUE.SOURCE.TRADING;
    case 'deeplink':
      return PERPS_EVENT_VALUE.SOURCE.DEEPLINK;
    case 'wallet_home_perps_tab':
    case 'homescreen_tab':
      return PERPS_EVENT_VALUE.SOURCE.HOMESCREEN_TAB;
    default:
      return source;
  }
}

function isDeeplinkSearch(search?: string): boolean {
  return new URLSearchParams(search ?? '').get('source') === 'deeplink';
}

/**
 * The query substring of the hash route — everything from the first `?` inside
 * `window.location.hash`. In a hash router the destination query lives in the
 * hash, and `window.location` reflects it synchronously the instant the route
 * renders, whereas react-router's `useLocation().search` can lag one render.
 * Reading the hash directly makes the entry screen-view's attribution
 * deterministic. Empty in non-hash / test environments (callers fall back to the
 * provider's locationSearch-derived store).
 *
 * @returns The hash query including its leading `?`, or `''` when absent.
 */
export function getHashSearch(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  const queryIndex = window.location.hash.indexOf('?');
  return queryIndex === -1 ? '' : window.location.hash.slice(queryIndex);
}

function mapUtmToProperties(
  utm: ControllerAttributionContext,
): Record<string, Json> {
  const merged: Record<string, Json> = {};
  if (utm.utmSource !== undefined) {
    merged[PERPS_EVENT_PROPERTY.UTM_SOURCE] = utm.utmSource;
  }
  if (utm.utmMedium !== undefined) {
    merged[PERPS_EVENT_PROPERTY.UTM_MEDIUM] = utm.utmMedium;
  }
  if (utm.utmCampaign !== undefined) {
    merged[PERPS_EVENT_PROPERTY.UTM_CAMPAIGN] = utm.utmCampaign;
  }
  if (utm.utmContent !== undefined) {
    merged[PERPS_EVENT_PROPERTY.UTM_CONTENT] = utm.utmContent;
  }
  if (utm.utmTerm !== undefined) {
    merged[PERPS_EVENT_PROPERTY.UTM_TERM] = utm.utmTerm;
  }
  return merged;
}

/**
 * Read UTM + deeplink source from the CURRENT hash query at call time. Used by
 * `usePerpsEventTracking` to stamp the entry PERPS_SCREEN_VIEWED synchronously
 * at emit time — react-router applies the destination `search` one render after
 * the hash is already correct, so the fire-once entry emit would otherwise miss
 * UTM. Returns `{}` when the hash carries no attribution, so later in-app
 * navigations fall back to the provider's sticky store.
 *
 * @returns PERPS_EVENT_PROPERTY-keyed UTM (plus `source=deeplink`) from the hash.
 */
export function readScreenViewedHashAttribution(): Record<string, Json> {
  const search = getHashSearch();
  if (!search) {
    return {};
  }
  const merged = mapUtmToProperties(parseUtmAttribution(search) ?? {});
  if (isDeeplinkSearch(search)) {
    merged[PERPS_EVENT_PROPERTY.SOURCE] = PERPS_EVENT_VALUE.SOURCE.DEEPLINK;
  }
  return merged;
}

// Session-scoped UTM attribution shared across PerpsAttributionProvider
// instances (last-touch). A deeplink to the wallet perps tab mounts one
// provider; navigating deeper into /perps/* ("See all") mounts a FRESH provider
// on a bare in-app URL, which would otherwise lose the entry UTM on its client
// PERPS_SCREEN_VIEWED. Mirroring the controller's session-global attribution,
// the first utm-bearing entry seeds this store so later provider instances
// inherit the campaign UTM. Lifetime = the extension UI session (page load).
//
// NOTE: only UTM is session-sticky. `source=deeplink` is deliberately PER-ENTRY
// (derived from each provider instance's own location), so a later NON-deeplink
// perps entry reports its actual source while still carrying the last-touch UTM.
let sessionUtmAttribution: ControllerAttributionContext = {};

// Module-level writer so the store update is not a variable reassignment inside
// the component/hook body (react-compiler purity rule) — it runs from effects.
// Returns the merged accumulated context so callers can forward the full
// session UTM (not just the latest partial) to the controller.
function rememberSessionUtm(
  utm: ControllerAttributionContext,
): ControllerAttributionContext {
  sessionUtmAttribution = { ...sessionUtmAttribution, ...utm };
  return sessionUtmAttribution;
}

/**
 * Reset the session-scoped attribution store. Test-only — in production its
 * lifetime is the UI session (page load).
 */
export function resetPerpsSessionAttribution(): void {
  sessionUtmAttribution = {};
}

/**
 * Derive the flow attribution (discovery source + deeplink entry point) from a
 * location search string. Used to seed provider state synchronously on the
 * first render so the entry screen's PERPS_SCREEN_VIEWED is not emitted before
 * attribution is ready.
 * @param search
 */
function computeFlowAttributionFromSearch(
  search?: string,
): PerpsFlowAttribution {
  if (!search) {
    return {};
  }
  const source = new URLSearchParams(search).get('source');
  const discoverySource = mapSourceParamToDiscovery(source);
  if (!discoverySource) {
    return {};
  }
  return {
    discoverySource,
    ...(source === 'deeplink'
      ? { entryPoint: PERPS_EVENT_VALUE.SOURCE.DEEPLINK }
      : {}),
  };
}

export function PerpsAttributionProvider({
  children,
  locationSearch,
}: {
  children: ReactNode;
  locationSearch?: string;
}) {
  // Seed synchronously from locationSearch on first render (not in an effect) so
  // the initial PERPS_SCREEN_VIEWED already carries utm_*/source=deeplink — an
  // effect would run after the first emit and miss the entry screen.
  const [flowAttribution, setFlowAttributionState] =
    useState<PerpsFlowAttribution>(() =>
      computeFlowAttributionFromSearch(locationSearch),
    );
  // Mirror the UTM context client-side so PERPS_SCREEN_VIEWED (emitted from the
  // client, not the controller) can merge it at emit time.
  // Seed from the session store first, then this instance's search — a provider
  // mounted on a bare in-app URL still inherits the session's entry UTM.
  const [utmAttribution, setUtmAttribution] =
    useState<ControllerAttributionContext>(() => ({
      ...sessionUtmAttribution,
      ...(parseUtmAttribution(locationSearch ?? '') ?? {}),
    }));
  // Whether THIS provider instance was entered via a deeplink. Per-entry: seeded
  // from this instance's own location (not inherited across mounts), and sticky
  // only within this instance's lifetime so in-app navigation after a deeplink
  // entry keeps source='deeplink' — while a later fresh mount on a non-deeplink
  // URL reports its actual (non-deeplink) source.
  const [isDeeplinkEntry, setIsDeeplinkEntry] = useState(() =>
    isDeeplinkSearch(locationSearch),
  );

  const setFlowAttribution = useCallback(
    (next: Partial<PerpsFlowAttribution>) => {
      setFlowAttributionState((prev) => ({ ...prev, ...next }));
    },
    [],
  );

  const clearFlowAttribution = useCallback(() => {
    setFlowAttributionState({});
  }, []);

  const syncUtmAttributionFromSearch = useCallback((search: string) => {
    const utmContext = parseUtmAttribution(search);
    if (utmContext) {
      // Persist to the session store so later provider instances inherit it,
      // and merge into this instance's state.
      const mergedSessionUtm = rememberSessionUtm(utmContext);
      setUtmAttribution((prev) => ({ ...prev, ...utmContext }));
      // Forward the ACCUMULATED session UTM (not just this latest partial):
      // setAttributionContext replaces the controller's stored context wholesale,
      // so sending only `utmContext` would drop earlier partials and diverge from
      // the client-side accumulation (e.g. {source,medium} on the client vs
      // {source} on the controller).
      // fire-and-forget — analytics must not block navigation. A failed write
      // only means controller-emitted events miss UTM enrichment; the client
      // still merges the mirrored context, so log for visibility rather than
      // swallow.
      submitRequestToBackground('perpsSetAttributionContext', [
        mergedSessionUtm,
      ]).catch(captureException);
    }

    const source = new URLSearchParams(search).get('source');
    // Sticky within THIS instance: a deeplink entry stays flagged for the life
    // of this provider even after in-app navigation stops carrying
    // source=deeplink. Not persisted to the session store — source is per-entry.
    if (source === 'deeplink') {
      setIsDeeplinkEntry(true);
    }
    const discoverySource = mapSourceParamToDiscovery(source);
    if (discoverySource) {
      setFlowAttributionState((prev) => ({
        ...prev,
        discoverySource,
        ...(source === 'deeplink'
          ? { entryPoint: PERPS_EVENT_VALUE.SOURCE.DEEPLINK }
          : {}),
      }));
    }
  }, []);

  useEffect(() => {
    if (locationSearch) {
      syncUtmAttributionFromSearch(locationSearch);
    }
  }, [locationSearch, syncUtmAttributionFromSearch]);

  // UTM (keyed by PERPS_EVENT_PROPERTY) plus a deeplink source override, merged
  // into every client PERPS_SCREEN_VIEWED event.
  const screenViewedAttribution = useMemo<Record<string, Json>>(() => {
    // Derive UTM from the CURRENT locationSearch at render time and union it
    // over the session-sticky store. The screen-view event can fire (fire-once)
    // on the same render the utm-bearing search first applies — before the
    // provider's `syncUtmAttributionFromSearch` effect back-fills utmAttribution
    // state (React runs effects after render) — and the fire-once guard blocks
    // an enriched re-fire. Reading utmAttribution state alone loses that first
    // emit's UTM; deriving from locationSearch here makes UTM as synchronous as
    // the deeplink source. The sticky store still covers later in-app
    // navigations whose search no longer carries utm.
    const merged = mapUtmToProperties({
      ...utmAttribution,
      ...(parseUtmAttribution(locationSearch ?? '') ?? {}),
    });
    // Sticky flag OR the current search — same render-time synchronicity.
    if (isDeeplinkEntry || isDeeplinkSearch(locationSearch)) {
      merged[PERPS_EVENT_PROPERTY.SOURCE] = PERPS_EVENT_VALUE.SOURCE.DEEPLINK;
    }
    return merged;
  }, [utmAttribution, isDeeplinkEntry, locationSearch]);

  const value = useMemo(
    () => ({
      flowAttribution,
      setFlowAttribution,
      clearFlowAttribution,
      syncUtmAttributionFromSearch,
      screenViewedAttribution,
    }),
    [
      flowAttribution,
      setFlowAttribution,
      clearFlowAttribution,
      syncUtmAttributionFromSearch,
      screenViewedAttribution,
    ],
  );

  return (
    <PerpsAttributionReactContext.Provider value={value}>
      {children}
    </PerpsAttributionReactContext.Provider>
  );
}

export function usePerpsAttributionContext(): PerpsAttributionContextValue {
  const context = useContext(PerpsAttributionReactContext);
  if (!context) {
    throw new Error(
      'usePerpsAttributionContext must be used within PerpsAttributionProvider',
    );
  }
  return context;
}
