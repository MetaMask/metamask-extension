import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { CaipChainId } from '@metamask/utils';
import { useMultichainBalances } from '../../hooks/useMultichainBalances';
import { NonEvmQueryParams } from '../../../shared/lib/deep-links/routes/nonevm';
import { SWAP_ROUTE } from '../../../shared/lib/deep-links/routes/route';
import { BridgeQueryParams } from '../../../shared/lib/deep-links/routes/swap';
import { RampsMetaMaskEntry } from '../../hooks/ramps/useRamps/useRamps';
import {
  getDataCollectionForMarketing,
  getMetaMetricsId,
  getParticipateInMetaMetrics,
} from '../../selectors';
import { BaseUrl } from '../../../shared/constants/urls';

const { getExtensionURL } = globalThis.platform;

const getSwapUrl = (chainId: CaipChainId): string => {
  const query = new URLSearchParams();
  query.set('sourceToken', chainId);
  query.set(BridgeQueryParams.SWAPS, 'true');
  return getExtensionURL(SWAP_ROUTE, query.toString());
};

const getBuyUrl = (
  chainId: CaipChainId,
  metaMetricsId: string | null,
  isMetaMetricsEnabled: boolean,
  isMarketingEnabled: boolean,
): string => {
  const buyParams = new URLSearchParams();
  buyParams.set('metamaskEntry', RampsMetaMaskEntry.BuySellButton);
  buyParams.set('chainId', chainId);

  if (metaMetricsId) {
    buyParams.set('metametricsId', metaMetricsId);
  }

  buyParams.set('metricsEnabled', String(isMetaMetricsEnabled));

  if (isMarketingEnabled) {
    buyParams.set('marketingEnabled', String(isMarketingEnabled));
  }

  const buyUrl = new URL('/buy', BaseUrl.Portfolio);
  buyUrl.search = buyParams.toString();
  return buyUrl.toString();
};

export const NonEvmBalanceCheck = () => {
  const location = useLocation();
  const metaMetricsId = useSelector(getMetaMetricsId);
  const isMetaMetricsEnabled = useSelector(getParticipateInMetaMetrics);
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);

  const params = new URLSearchParams(location.search);
  const chainId = params
    .get(NonEvmQueryParams.CHAIN_ID)
    ?.toLowerCase() as CaipChainId;

  const { assetsWithBalance } = useMultichainBalances();

  useEffect(() => {
    if (!chainId) {
      return;
    }

    const hasPositiveBalance = assetsWithBalance.some(
      (asset) => asset.balance && asset.balance !== '0',
    );

    window.location.href = hasPositiveBalance
      ? getSwapUrl(chainId)
      : getBuyUrl(
          chainId,
          metaMetricsId,
          isMetaMetricsEnabled,
          isMarketingEnabled,
        );
  }, [
    chainId,
    assetsWithBalance,
    metaMetricsId,
    isMetaMetricsEnabled,
    isMarketingEnabled,
  ]);

  return null;
};
