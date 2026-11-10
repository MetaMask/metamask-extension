import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { parseCaipAssetType, type CaipAssetType } from '@metamask/utils';
import type { CurrencyRateState } from '@metamask/assets-controllers';
import type {
  AssetsControllerState,
  FungibleAssetPrice,
} from '@metamask/assets-controller';
import { CHAIN_IDS, CURRENCY_SYMBOLS } from '../../../constants/network';

/**
 * Tempo Chain Augmentation Module
 * Contains specific logic that is reused across the app to augment Tempo specific functionality.
 *
 * Listed Augmentations:
 * - Tempo has no native asset. Its native currency is USD.
 * - CoinGecko exposes no native coin for Tempo, so there is no USD fiat rate.
 * - The wallet derives the USD fiat rate from the price of a Tempo token instead.
 */
const TEMPO_CAIP_CHAIN_IDS = new Set<string>([
  formatChainIdToCaip(CHAIN_IDS.TEMPO_MAINNET),
  formatChainIdToCaip(CHAIN_IDS.TEMPO_TESTNET),
]);

/**
 * Adds the USD fiat rate derived from Tempo token prices.
 *
 * @param currencyRates - Currency rates keyed by native symbol.
 * @param assetsPrice - Asset prices keyed by CAIP-19 asset id.
 * @returns Currency rates including the derived USD rate when one is available.
 */
export function augmentTempoCurrencyRates(
  currencyRates: CurrencyRateState['currencyRates'],
  assetsPrice: AssetsControllerState['assetsPrice'],
): CurrencyRateState['currencyRates'] {
  const symbol = CURRENCY_SYMBOLS.TEMPO_MAINNET;

  if (currencyRates[symbol]) {
    return currencyRates;
  }

  let latest: FungibleAssetPrice | undefined;

  for (const [assetId, price] of Object.entries(assetsPrice)) {
    const { chainId } = parseCaipAssetType(assetId as CaipAssetType);

    if (
      TEMPO_CAIP_CHAIN_IDS.has(chainId) &&
      price.assetPriceType === 'fungible' &&
      Number.isFinite(price.price) &&
      price.price > 0 &&
      Number.isFinite(price.usdPrice) &&
      price.usdPrice > 0 &&
      (!latest || price.lastUpdated > latest.lastUpdated)
    ) {
      latest = price;
    }
  }

  if (!latest) {
    return currencyRates;
  }

  return {
    ...currencyRates,
    [symbol]: {
      conversionDate: latest.lastUpdated / 1000,
      conversionRate: latest.price / latest.usdPrice,
      usdConversionRate: 1,
    },
  };
}
