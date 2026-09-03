import { AssetType, formatChainIdToCaip } from '@metamask/bridge-controller';
import { CaipAssetType, Hex, isCaipChainId } from '@metamask/utils';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { toChecksumHexAddress } from '../../../../shared/lib/hexstring-utils';
import { isEvmChainId, toAssetId } from '../../../../shared/lib/asset-utils';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
import {
  getNativeAssetForChainIdSafe,
  getTokenExchangeRate,
} from '../../../ducks/bridge/utils';
import { getCurrencyRates, getMarketData } from '../../../selectors';
import { getAssetsRates } from '../../../selectors/assets';
import { Asset } from '../types/asset';

/**
 * Get the current price of an asset from Redux cache, falling back to the
 * price API spot-prices endpoint when the token is not in the wallet.
 *
 * @param asset - The asset to get the current price of
 * @returns The current price of the asset. If the asset is not found, or the price is not found, returns undefined.
 */
export const useCurrentPrice = (asset: Asset): { currentPrice?: number } => {
  const isEvm = isEvmChainId(asset.chainId);
  const evmMarketData = useSelector(getMarketData);
  const evmCurrencyRates = useSelector(getCurrencyRates);
  const nonEvmConversionRates = useSelector(getAssetsRates);
  const currentCurrency = useSelector(getCurrentCurrency);

  const { chainId, type } = asset;

  const cachedPrice = useMemo(() => {
    if (isEvm) {
      if (type === AssetType.native) {
        return evmCurrencyRates[asset.symbol]?.conversionRate;
      }

      const address = toChecksumHexAddress(asset.address) as Hex;
      const tokenMarketPrice = evmMarketData[chainId]?.[address]?.price;
      const baseCurrency = evmMarketData[chainId]?.[address]?.currency;
      const tokenExchangeRate =
        evmCurrencyRates[baseCurrency]?.conversionRate ?? undefined;

      if (tokenExchangeRate !== undefined && tokenMarketPrice !== undefined) {
        return tokenExchangeRate * tokenMarketPrice;
      }

      return undefined;
    }

    const assetId =
      type === AssetType.token
        ? asset.address
        : getNativeAssetForChainIdSafe(chainId)?.assetId;

    if (!assetId && type === AssetType.native) {
      return undefined;
    }

    const currentPriceAsString =
      nonEvmConversionRates?.[assetId as CaipAssetType]?.rate;

    return currentPriceAsString ? parseFloat(currentPriceAsString) : undefined;
  }, [
    isEvm,
    asset,
    chainId,
    type,
    evmMarketData,
    evmCurrencyRates,
    nonEvmConversionRates,
  ]);

  const spotPriceAssetId = useMemo((): CaipAssetType | undefined => {
    if (cachedPrice !== undefined) {
      return undefined;
    }

    const caipChainId = isCaipChainId(chainId)
      ? chainId
      : formatChainIdToCaip(chainId);

    if (type === AssetType.native) {
      return getNativeAssetForChainIdSafe(chainId)?.assetId;
    }

    if (type === AssetType.token) {
      const address = isEvm
        ? toChecksumHexAddress(asset.address)
        : asset.address;
      return toAssetId(address, caipChainId);
    }

    return undefined;
  }, [cachedPrice, asset, chainId, isEvm, type]);

  const [fetchedPriceState, setFetchedPriceState] = useState<{
    assetId: CaipAssetType;
    price?: number;
  }>();

  useEffect(() => {
    if (!spotPriceAssetId) {
      return undefined;
    }

    const abortController = new AbortController();
    let isCancelled = false;

    const fetchPrice = async () => {
      try {
        const price = await getTokenExchangeRate({
          assetId: spotPriceAssetId,
          currency: currentCurrency.toLowerCase(),
          signal: abortController.signal,
        });
        if (!isCancelled) {
          setFetchedPriceState({ assetId: spotPriceAssetId, price });
        }
      } catch {
        if (!isCancelled) {
          setFetchedPriceState({ assetId: spotPriceAssetId, price: undefined });
        }
      }
    };

    fetchPrice();

    return () => {
      isCancelled = true;
      abortController.abort();
    };
  }, [spotPriceAssetId, currentCurrency]);

  const fetchedPrice =
    fetchedPriceState?.assetId === spotPriceAssetId
      ? fetchedPriceState.price
      : undefined;

  return { currentPrice: cachedPrice ?? fetchedPrice };
};
