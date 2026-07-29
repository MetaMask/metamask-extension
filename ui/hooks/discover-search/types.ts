import type { TrendingAsset } from '@metamask/assets-controllers';
import type { PerpsMarketData } from '@metamask/perps-controller';

export type DiscoverSearchTab = 'all' | 'crypto' | 'perps' | 'stocks';

export type DiscoverSearchSectionId = 'crypto' | 'perps' | 'stocks';

export type DiscoverAssetResult = TrendingAsset;

export type DiscoverSearchSection<TItem = unknown> = {
  id: DiscoverSearchSectionId;
  titleKey: string;
  items: TItem[];
  isLoading: boolean;
  error?: Error | null;
};

export type DiscoverSearchResult = {
  crypto: DiscoverSearchSection<DiscoverAssetResult>;
  perps: DiscoverSearchSection<PerpsMarketData>;
  stocks: DiscoverSearchSection<DiscoverAssetResult>;
  isDebouncing: boolean;
};

/** Market fields returned by token search when `includeMarketData` is true. */
export type TokenSearchMarketResult = {
  assetId: string;
  name: string;
  symbol: string;
  decimals: number;
  price?: string;
  marketCap?: number;
  aggregatedUsdVolume?: number;
  pricePercentChange1d?: string;
  rwaData?: TrendingAsset['rwaData'];
  securityData?: TrendingAsset['securityData'];
};
