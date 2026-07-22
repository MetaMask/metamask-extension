export type CashtagAsset = {
  symbol: string;
  name: string;
  icon: string;
  color: string;
};

export type Price = {
  symbol: string;
  value: number | null;
  percentChange: number | null;
};

export type WidgetModel = {
  asset: CashtagAsset;
  price: Price;
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
      environmentType?: string;
    }) => void;
  };
  currencyRateController?: {
    state?: {
      currentCurrency?: string;
      currencyRates?: Record<
        string,
        { conversionRate?: number | null; usdConversionRate?: number | null }
      >;
    };
  };
  multichainRatesController?: {
    state?: {
      fiatCurrency?: string;
      rates?: Record<
        string,
        { conversionRate?: number | null; usdConversionRate?: number | null }
      >;
    };
  };
  tokenRatesController?: {
    state?: {
      marketData?: Record<
        string,
        Record<string, { pricePercentChange1d?: number | null } | undefined>
      >;
    };
  };
};
