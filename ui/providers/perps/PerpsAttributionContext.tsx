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
import { PERPS_EVENT_VALUE } from '../../../shared/constants/perps-events';
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
};

const PerpsAttributionReactContext =
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

export function PerpsAttributionProvider({
  children,
  locationSearch,
}: {
  children: ReactNode;
  locationSearch?: string;
}) {
  const [flowAttribution, setFlowAttributionState] =
    useState<PerpsFlowAttribution>({});

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
      // fire-and-forget — analytics must not block navigation
      submitRequestToBackground('perpsSetAttributionContext', [
        utmContext,
      ]).catch(() => {
        // intentionally empty
      });
    }

    const source = new URLSearchParams(search).get('source');
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

  const value = useMemo(
    () => ({
      flowAttribution,
      setFlowAttribution,
      clearFlowAttribution,
      syncUtmAttributionFromSearch,
    }),
    [
      flowAttribution,
      setFlowAttribution,
      clearFlowAttribution,
      syncUtmAttributionFromSearch,
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
