import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { isSolanaChainId } from '@metamask/bridge-controller';
import { CaipChainId, Hex, hexToNumber } from '@metamask/utils';
import { ChainId } from '../../../../shared/constants/network';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';
import {
  getDataCollectionForMarketing,
  getMetaMetricsId,
  getParticipateInMetaMetrics,
} from '../../../selectors';

type IUseRamps = {
  openBuyCryptoInPdapp: (chainId?: ChainId | CaipChainId) => void;
  getBuyURI: (chainId: ChainId | CaipChainId) => string;
};

export enum RampsMetaMaskEntry {
  BuySellButton = 'ext_buy_sell_button',
  NftBanner = 'ext_buy_banner_nfts',
  TokensBanner = 'ext_buy_banner_tokens',
  ActivityBanner = 'ext_buy_banner_activity',
  BtcBanner = 'ext_buy_banner_btc',
}

const useRamps = (
  metamaskEntry: RampsMetaMaskEntry = RampsMetaMaskEntry.BuySellButton,
): IUseRamps => {
  const chainId = useSelector(getCurrentChainId);
  const metaMetricsId = useSelector(getMetaMetricsId);
  const isMetaMetricsEnabled = useSelector(getParticipateInMetaMetrics);
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);

  const getBuyURI = useCallback(
    (_chainId: Hex | CaipChainId) => {
      try {
        const params = new URLSearchParams();
        params.set('metamaskEntry', metamaskEntry);

        let numericChainId = '';
        if (isSolanaChainId(_chainId)) {
          numericChainId = _chainId;
        } else {
          numericChainId = hexToNumber(_chainId).toString();
        }
        params.set('chainId', numericChainId);
        if (metaMetricsId) {
          params.set('metametricsId', metaMetricsId);
        }
        params.set('metricsEnabled', String(isMetaMetricsEnabled));
        if (isMarketingEnabled) {
          params.set('marketingEnabled', String(isMarketingEnabled));
        }
        const url = new URL(process.env.PORTFOLIO_URL || '');
        url.pathname = 'buy';
        url.search = params.toString();
        return url.toString();
      } catch {
        return 'https://app.metamask.io/buy';
      }
    },
    [isMarketingEnabled, isMetaMetricsEnabled, metaMetricsId, metamaskEntry],
  );

  const openBuyCryptoInPdapp = useCallback(
    (_chainId?: ChainId | CaipChainId) => {
      const buyUrl = getBuyURI(_chainId || chainId);
      global.platform.openTab({
        url: buyUrl,
      });
    },
    [chainId, getBuyURI],
  );

  return { openBuyCryptoInPdapp, getBuyURI };
};

export default useRamps;
