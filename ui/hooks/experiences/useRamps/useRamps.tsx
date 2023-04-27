import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import log from 'loglevel';
import { AggregatorNetwork } from '@consensys/on-ramp-sdk/dist/API';
import { ChainId, CHAIN_IDS } from '../../../../shared/constants/network';
import { getCurrentChainId } from '../../../selectors';
import SDK from './OnRampSDK';
import {
  buyPath,
  entryParam,
  entryParamValue,
  MANUALLY_ACTIVE_CHAIN_IDS,
  portfolioUrl,
} from './useRamps.constants';

interface IUseRamps {
  openBuyCryptoInPdapp: VoidFunction;
  getBuyURI: (chainId: ChainId) => string;
  isBuyableChain: boolean;
  isNativeTokenBuyableChain: boolean;
}

const getBuyURI = (chainId: ChainId) => {
  switch (chainId) {
    case CHAIN_IDS.SEPOLIA:
      return 'https://faucet.sepolia.dev/';
    default: {
      const url = new URL(`${portfolioUrl}${buyPath}`);
      url.searchParams.set(entryParam, entryParamValue);
      return url.toString();
    }
  }
};

const useRamps = (): IUseRamps => {
  const chainId = useSelector(getCurrentChainId);
  const [networks, setNetworks] = useState<AggregatorNetwork[] | null>(null);

  const isManuallyActive = MANUALLY_ACTIVE_CHAIN_IDS.includes(chainId);

  useEffect(() => {
    (async () => {
      if (isManuallyActive) {
        return;
      }
      try {
        const sdkNetworks = await SDK.getNetworks();
        setNetworks(sdkNetworks);
      } catch (error) {
        log.error('useRamps::SDK.getNetworks failed', error);
      }
    })();
  }, [chainId]);

  const openBuyCryptoInPdapp = useCallback(() => {
    const buyUrl = getBuyURI(chainId);
    global.platform.openTab({
      url: buyUrl,
    });
  }, [chainId]);

  const network = networks?.find(
    (n) => `0x${n.chainId.toString(16)}` === chainId,
  );

  const isBuyableChain = isManuallyActive || (network?.active ?? false);
  const isNativeTokenBuyableChain =
    isManuallyActive ||
    ((network?.active && network?.nativeTokenSupported) ?? false);

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
