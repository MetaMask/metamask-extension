import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { CaipChainId } from '@metamask/utils';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { getCurrentCaipChainId, getMetaMetricsId } from '../../selectors';

interface IUseRamps {
  openBuyCryptoInPdapp: VoidFunction;
  getBuyURI: (caipChainId: CaipChainId) => string;
}

const portfolioUrl = process.env.PORTFOLIO_URL;

const useRamps = (): IUseRamps => {
  const caipChainId = useSelector(getCurrentCaipChainId);
  const metaMetricsId = useSelector(getMetaMetricsId);

  const getBuyURI = useCallback((_caipChainId: CaipChainId) => {
    switch (_caipChainId) {
      case CHAIN_IDS.SEPOLIA:
        return 'https://faucet.sepolia.dev/';
      default: {
        const params = new URLSearchParams();
        params.set('metamaskEntry', 'ext_buy_button');
        if (metaMetricsId) {
          params.set('metametricsId', metaMetricsId);
        }
        return `${portfolioUrl}/buy?${params.toString()}`;
      }
    }
  }, []);

  const openBuyCryptoInPdapp = useCallback(() => {
    const buyUrl = getBuyURI(caipChainId);
    global.platform.openTab({
      url: buyUrl,
    });
  }, []);

  return { openBuyCryptoInPdapp, getBuyURI };
};

export default useRamps;
