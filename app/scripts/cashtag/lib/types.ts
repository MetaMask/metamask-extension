import type { PreferencesController } from '../../controllers/preferences-controller';

export type AssetData = {
  ticker: string;
  name: string;
  iconUrl: string | null;
  color: string | null;
  caipAssetId: string | null;
  chainId: string | null;
  isNative: boolean;
  resultType: string | null;
  price: number | null;
  change24hPercent: number | null;
  marketCap: number | null;
  liquidity: number | null;
  volume24h: number | null;
};

export type PricePoint = {
  time: number;
  value: number;
};

export type ResolvedTicker = {
  primary: AssetData;
  similar: AssetData[];
};

export type WidgetModel = {
  data: AssetData;
  similar: AssetData[];
  displayTicker: string;
  onSwap: (asset: AssetData) => void;
  onViewDetails: (asset: AssetData) => void;
  onViewSimilar: () => void;
  onSelectSimilar: (asset: AssetData) => void;
  onDisable: () => void;
};

export type Controller = {
  controllerMessenger?: {
    subscribe: (
      event: string,
      listener: () => void,
      selector?: (state: {
        useExternalServices?: boolean;
        preferences?: { showTickerWidget?: boolean };
        remoteFeatureFlags?: Record<string, unknown>;
      }) => boolean,
    ) => void;
  };
  remoteFeatureFlagController?: {
    state?: { remoteFeatureFlags?: Record<string, unknown> };
  };
  preferencesController?: {
    state?: {
      useExternalServices?: boolean;
      preferences?: {
        showTickerWidget?: boolean;
        useSidePanelAsDefault?: boolean;
      };
    };
    setPreference?: PreferencesController['setPreference'];
  };
};
