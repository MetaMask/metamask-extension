import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { CaipChainId, Hex } from '@metamask/utils';
import { getUseSafeChainsListValidation } from '../selectors';
import { getMultichainCurrentNetwork } from '../selectors/multichain';
import { isEvmChainId } from '../../shared/lib/asset-utils';

import { getValidUrl } from '../../shared/lib/url-utils';
import { isOriginalNativeTokenSymbol } from '../helpers/utils/isOriginalNativeTokenSymbol';

const isLocalhostUrl = (urlString: string) => {
  const url = getValidUrl(urlString);

  return (
    url !== null &&
    (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
  );
};

type NativeTokenSymbolValidationOptions = {
  rpcUrl?: string;
  enabled?: boolean;
};

export function useIsOriginalNativeTokenSymbol(
  chainId: Hex | CaipChainId,
  ticker: string,
  { rpcUrl = '', enabled = true }: NativeTokenSymbolValidationOptions = {},
) {
  const [validation, setValidation] = useState<{
    key: string;
    value: boolean;
  }>();
  const useSafeChainsListValidation = useSelector(
    getUseSafeChainsListValidation,
  );

  const isEvm = isEvmChainId(chainId);
  const providerConfig = useSelector(getMultichainCurrentNetwork);
  const isLocalhostRpc = isLocalhostUrl(rpcUrl);
  const validationKey = isEvm
    ? [chainId, ticker, useSafeChainsListValidation, isLocalhostRpc].join(':')
    : [chainId, ticker, providerConfig?.ticker].join(':');

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let isMounted = true;

    const setIsOriginalNativeSymbol = (value: boolean) => {
      if (isMounted) {
        setValidation({ key: validationKey, value });
      }
    };

    async function getNativeTokenSymbol(networkId: Hex | CaipChainId) {
      if (!isEvm) {
        setIsOriginalNativeSymbol(ticker === providerConfig?.ticker);
        return;
      }

      try {
        // exclude local dev network
        if (isLocalhostRpc) {
          setIsOriginalNativeSymbol(true);
          return;
        }

        const isOriginalNativeToken = await isOriginalNativeTokenSymbol({
          ticker,
          chainId: networkId,
          useAPICall: useSafeChainsListValidation,
        });

        setIsOriginalNativeSymbol(isOriginalNativeToken);
      } catch (err) {
        setIsOriginalNativeSymbol(false);
      }
    }

    getNativeTokenSymbol(chainId);

    return () => {
      isMounted = false;
    };
  }, [
    chainId,
    ticker,
    enabled,
    isLocalhostRpc,
    useSafeChainsListValidation,
    isEvm,
    providerConfig?.ticker,
    validationKey,
  ]);

  if (!enabled) {
    return true;
  }

  return validation?.key === validationKey ? validation.value : undefined;
}
