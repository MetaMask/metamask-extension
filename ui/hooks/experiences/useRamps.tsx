import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Context, Environment, OnRampSdk } from '@consensys/on-ramp-sdk';
import { ChainId, CHAIN_IDS } from '../../../shared/constants/network';
import { getCurrentChainId } from '../../selectors';

const SDK = OnRampSdk.create(
  // TODO(wachunei): define the environment based on the build
  // isDev ? Environment.Staging : Environment.Production,
  Environment.Staging,
  Context.Extension,
  {
    verbose: true,
  },
);

interface IUseRamps {
  openBuyCryptoInPdapp: VoidFunction;
  getBuyURI: (chainId: ChainId) => string;
  isBuyableChain: boolean;
  isNativeTokenBuyableChain: boolean;
}

const portfolioUrl = process.env.PORTFOLIO_URL;

const useRamps = (): IUseRamps => {
  const chainId = useSelector(getCurrentChainId);
  const [isBuyableChain, setIsBuyableChain] = useState(false);
  const [isNativeTokenBuyableChain, setIsNativeTokenBuyableChain] =
    useState(false);

  useEffect(() => {
    (async () => {
      try {
        const networks = await SDK.getNetworks();
        const network = networks.find(
          (n) => `0x${n.chainId.toString(16)}` === chainId,
        );

        setIsBuyableChain(network?.active ?? false);
        setIsNativeTokenBuyableChain(
          (network?.active && network?.nativeTokenSupported) ?? false,
        );
      } catch (error) {
        console.log(error);
      }
    })();
  }, [chainId]);

  const getBuyURI = useCallback((_chainId: ChainId) => {
    switch (_chainId) {
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

  return {
    openBuyCryptoInPdapp,
    getBuyURI,
    isBuyableChain,
    isNativeTokenBuyableChain,
  };
};

export function withUseRamps<T>(
  Component: React.ComponentType<T>,
): React.FC<T> {
  return (props) => {
    const ramps = useRamps();
    return <Component {...props} {...ramps} />;
  };
}

export default useRamps;
