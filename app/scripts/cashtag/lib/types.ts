export type AssetData = {
  ticker: string;
  name: string;
  iconUrl: string | null;
  color: string | null;
  caipAssetId: string | null;
  chainId: string | null;
  isNative: boolean;
  price: number | null;
  change24hPercent: number | null;
  marketCap: number | null;
  volume24h: number | null;
  sparkline: number[] | null;
};

export type WidgetModel = {
  data: AssetData;
  onSwap: () => void;
  onDisable: () => void;
};

export type InterestAnchor = HTMLAnchorElement & {
  interestForElement: Element | null;
};

export type InterestEvent = Event & {
  source: Element | null;
};

export type Controller = {
  remoteFeatureFlagController?: {
    state?: { remoteFeatureFlags?: Record<string, unknown> };
  };
  appStateController?: {
    setPendingRedirectRoute?: (route: {
      path: string;
      search?: `?${string}`;
      environmentType?: string;
    }) => void;
  };
};
