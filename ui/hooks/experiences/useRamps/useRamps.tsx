import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import log from 'loglevel';
import { ChainId, CHAIN_IDS } from '../../../../shared/constants/network';
import { getCurrentChainId } from '../../../selectors';
import { AggregatorNetwork } from './useRamps.types';
import SDK from './OnRampAPI';
import {
  buyPath,
  entryParam,
  entryParamValue,
  MANUALLY_ACTIVE_CHAIN_IDS,
  portfolioUrl,
} from './useRamps.constants';

interface BuyURLParams {
  [key: string]: any;
}
interface IUseRamps {
  openBuyCryptoInPdapp: (params?: BuyURLParams) => void;
  getBuyURI: (chainId: ChainId) => string;
  isBuyableChain: boolean;
  isNativeTokenBuyableChain: boolean;
}

const getBuyURI = (chainId: Hex, params?: BuyURLParams) => {
  switch (chainId) {
    case CHAIN_IDS.SEPOLIA:
      return 'https://faucet.sepolia.dev/';
    default: {
      const url = new URL(`${portfolioUrl}${buyPath}`);
      url.searchParams.set(entryParam, entryParamValue);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.set(key, value);
        });
      }
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

  const openBuyCryptoInPdapp = useCallback(
    (params) => {
      const buyUrl = getBuyURI(chainId, params);
      global.platform.openTab({
        url: buyUrl,
      });
    },
    [chainId],
  );

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
