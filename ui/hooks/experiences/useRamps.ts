import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { ChainId, CHAIN_IDS } from '../../../shared/constants/network';
import { getCurrentChainId } from '../../selectors';

interface IUseRamps {
  openBuyCryptoInPdapp: VoidFunction;
  getBuyURI: (chainId: ChainId) => string;
}

const portfolioUrl = process.env.PORTFOLIO_URL;

const useRamps = (): IUseRamps => {
  const chainId = useSelector(getCurrentChainId);

  const getBuyURI = useCallback((_chainId: ChainId) => {
    switch (_chainId) {
      case CHAIN_IDS.GOERLI:
        return 'https://goerli-faucet.slock.it/';
      case CHAIN_IDS.SEPOLIA:
        return 'https://faucet.sepolia.dev/';
      default:
        return `${portfolioUrl}/buy?metamaskEntry=ext_buy_button`;
    }
  }, []);

  const openBuyCryptoInPdapp = useCallback(() => {
    const buyUrl = getBuyURI(chainId);
    global.platform.openTab({
      url: buyUrl,
    });
  }, []);

  return { openBuyCryptoInPdapp, getBuyURI };
};

export default useRamps;
