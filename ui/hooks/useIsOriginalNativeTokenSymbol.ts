import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { CaipChainId, Hex } from '@metamask/utils';
import { getUseSafeChainsListValidation } from '../selectors';
import { getMultichainCurrentNetwork } from '../selectors/multichain';
import { isEvmChainId } from '../../shared/lib/asset-utils';

import { getValidUrl } from '../../shared/lib/url-utils';
import { isOriginalNativeTokenSymbol } from '../helpers/utils/isOriginalNativeTokenSymbol';

export function useIsOriginalNativeTokenSymbol(
  chainId: Hex | CaipChainId,
  ticker: string,
  type: string,
  rpcUrl = '',
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
  const validationKey = [
    chainId,
    ticker,
    type,
    rpcUrl,
    useSafeChainsListValidation,
    providerConfig?.ticker,
  ].join(':');

  useEffect(() => {
    let isMounted = true;

    const setIsOriginalNativeSymbol = (value: boolean) => {
      if (isMounted) {
        setValidation({ key: validationKey, value });
      }
    };

    const isLocalhost = (urlString: string) => {
      const url = getValidUrl(urlString);

      return (
        url !== null &&
        (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
      );
    };

    async function getNativeTokenSymbol(networkId: Hex | CaipChainId) {
      if (!isEvm) {
        setIsOriginalNativeSymbol(ticker === providerConfig?.ticker);
        return;
      }

      try {
        // exclude local dev network
        if (isLocalhost(rpcUrl)) {
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
    type,
    rpcUrl,
    useSafeChainsListValidation,
    isEvm,
    providerConfig?.ticker,
    validationKey,
  ]);

  return validation?.key === validationKey ? validation.value : undefined;
}
