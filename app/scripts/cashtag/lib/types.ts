export type AssetData = {
  ticker: string;
  name: string;
  iconUrl: string | null;
  color: string | null;
  caipAssetId: string | null;
  chainId: string | null;
  isNative: boolean;
  verified: boolean;
  price: number | null;
  change24hPercent: number | null;
  marketCap: number | null;
  liquidity: number | null;
  volume24h: number | null;
};

export type ResolvedTicker = {
  primary: AssetData;
  similar: AssetData[];
};

export type WidgetModel = {
  data: AssetData;
  similar: AssetData[];
  onSwap: (asset: AssetData) => void;
  onViewDetails: (asset: AssetData) => void;
  onDisable: () => void;
  onFlag: () => void;
};

export type InterestAnchor = HTMLAnchorElement & {
  interestForElement: Element | null;
};

export type InterestEvent = Event & {
  source: Element | null;
};

export type Controller = {
  controllerMessenger?: {
    subscribe: (
      event: string,
      listener: (value: boolean) => void,
      selector: (state: {
        preferences?: { showTickerWidget?: boolean };
      }) => boolean,
    ) => void;
  };
  remoteFeatureFlagController?: {
    state?: { remoteFeatureFlags?: Record<string, unknown> };
  };
  preferencesController?: {
    state?: {
      preferences?: {
        showTickerWidget?: boolean;
        useSidePanelAsDefault?: boolean;
      };
    };
    setPreference?: (preference: string, value: boolean) => unknown;
  };
  appStateController?: {
    setPendingRedirectRoute?: (route: {
      path: string;
      search?: `?${string}`;
      environmentType?: string;
    }) => void;
  };
};
