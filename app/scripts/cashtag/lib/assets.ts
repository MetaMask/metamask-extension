import type { CaipAssetType, CaipChainId } from '@metamask/utils';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { getAssetImageUrl } from '../../../../shared/lib/asset-utils';
import { searchTokens } from '../../../../shared/lib/token-search/token-search-api';
import type { AssetData } from './types';

const ICON_BASE = 'https://static.cx.metamask.io/api/v2/tokenIcons/assets';
const ETHEREUM = 'eip155:1' as CaipChainId;
const BNB_CHAIN = 'eip155:56' as CaipChainId;
const AVALANCHE = 'eip155:43114' as CaipChainId;

export const assetsWhitelist: { symbol: string; chainId: CaipChainId }[] = [
  { symbol: 'BTC', chainId: MultichainNetworks.BITCOIN },
  { symbol: 'ETH', chainId: ETHEREUM },
  { symbol: 'USDT', chainId: ETHEREUM },
  { symbol: 'BNB', chainId: BNB_CHAIN },
  { symbol: 'USDC', chainId: ETHEREUM },
  { symbol: 'XRP', chainId: ETHEREUM },
  { symbol: 'SOL', chainId: MultichainNetworks.SOLANA },
  { symbol: 'TRX', chainId: MultichainNetworks.TRON },
  { symbol: 'FIGR_HELOC', chainId: ETHEREUM },
  { symbol: 'WBT', chainId: ETHEREUM },
  { symbol: 'HYPE', chainId: ETHEREUM },
  { symbol: 'DOGE', chainId: ETHEREUM },
  { symbol: 'USDS', chainId: ETHEREUM },
  { symbol: 'RAIN', chainId: ETHEREUM },
  { symbol: 'ZEC', chainId: ETHEREUM },
  { symbol: 'LEO', chainId: ETHEREUM },
  { symbol: 'XMR', chainId: ETHEREUM },
  { symbol: 'LINK', chainId: ETHEREUM },
  { symbol: 'ADA', chainId: ETHEREUM },
  { symbol: 'XLM', chainId: MultichainNetworks.STELLAR },
  { symbol: 'CC', chainId: ETHEREUM },
  { symbol: 'DAI', chainId: ETHEREUM },
  { symbol: 'BCH', chainId: ETHEREUM },
  { symbol: 'USD1', chainId: ETHEREUM },
  { symbol: 'USDE', chainId: ETHEREUM },
  { symbol: 'GRAM', chainId: ETHEREUM },
  { symbol: 'LTC', chainId: ETHEREUM },
  { symbol: 'USDG', chainId: ETHEREUM },
  { symbol: 'HBAR', chainId: ETHEREUM },
  { symbol: 'SUI', chainId: ETHEREUM },
  { symbol: 'AVAX', chainId: AVALANCHE },
  { symbol: 'PYUSD', chainId: ETHEREUM },
  { symbol: 'CRO', chainId: ETHEREUM },
  { symbol: 'BUIDL', chainId: ETHEREUM },
  { symbol: 'NEAR', chainId: ETHEREUM },
  { symbol: 'XAUT', chainId: ETHEREUM },
  { symbol: 'SHIB', chainId: ETHEREUM },
  { symbol: 'UNI', chainId: ETHEREUM },
  { symbol: 'USDY', chainId: ETHEREUM },
  { symbol: 'ONDO', chainId: ETHEREUM },
];

type SearchHit = {
  assetId: CaipAssetType;
  symbol: string;
  name: string;
  price?: string | number | null;
  marketCap?: string | number | null;
  aggregatedUsdVolume?: string | number | null;
  pricePercentChange1d?: string | number | null;
};

function num(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function pickHit(symbol: string, hits: SearchHit[]) {
  const matches = hits.filter(
    (hit) => hit.symbol.toUpperCase() === symbol.toUpperCase(),
  );
  return (
    matches.find((hit) => hit.assetId.includes('/slip44:')) ??
    matches[0] ??
    null
  );
}

async function lookup(symbol: string, chainId: CaipChainId) {
  const response = await searchTokens({
    query: symbol,
    networks: [chainId],
    first: 25,
  });
  return pickHit(symbol, response.data as SearchHit[]);
}

export async function fetchAssetData(): Promise<AssetData[]> {
  const assets: AssetData[] = [];

  await Promise.all(
    assetsWhitelist.map(async ({ symbol, chainId }) => {
      try {
        const hit = await lookup(symbol, chainId);
        if (!hit) {
          return;
        }
        assets.push({
          ticker: symbol,
          name: hit.name,
          iconUrl:
            getAssetImageUrl(hit.assetId, chainId) ??
            `${ICON_BASE}/${hit.assetId.replaceAll(':', '/')}.png`,
          color: null,
          caipAssetId: hit.assetId,
          chainId,
          isNative: hit.assetId.includes('/slip44:'),
          price: num(hit.price),
          change24hPercent: num(hit.pricePercentChange1d),
          marketCap: num(hit.marketCap),
          volume24h: num(hit.aggregatedUsdVolume),
          sparkline: null,
        });
      } catch {
        // skip failed lookups
      }
    }),
  );

  return assets;
}
