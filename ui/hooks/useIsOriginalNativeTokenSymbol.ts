import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { CaipChainId, Hex } from '@metamask/utils';
import { useSafeChainsListValidationSelector } from '../selectors';
import {
  getMultichainIsEvm,
  getMultichainCurrentNetwork,
} from '../selectors/multichain';

// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getValidUrl } from '../../app/scripts/lib/util';
import { isOriginalNativeTokenSymbol } from '../helpers/utils/isOriginalNativeTokenSymbol';

export function useIsOriginalNativeTokenSymbol(
  chainId: Hex | CaipChainId,
  ticker: string,
  type: string,
  rpcUrl = '',
) {
  const [isOriginalNativeSymbol, setIsOriginalNativeSymbol] = useState(false);
  const useSafeChainsListValidation = useSelector(
    useSafeChainsListValidationSelector,
  );

  const isEvm = useSelector(getMultichainIsEvm);
  const providerConfig = useSelector(getMultichainCurrentNetwork);

  useEffect(() => {
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
  }, [
    isOriginalNativeSymbol,
    chainId,
    ticker,
    type,
    rpcUrl,
    useSafeChainsListValidation,
    isEvm,
    providerConfig?.ticker,
  ]);

  return isOriginalNativeSymbol;
}
