import { isAddress as isEvmAddress } from 'ethers/lib/utils';
import { isNativeAddress, isSolanaChainId } from '@metamask/bridge-controller';
import { useMemo } from 'react';

import { useSendContext } from '../../context/send';

export const useSendType = () => {
  const { asset, chainId } = useSendContext();
  const address = asset?.address || asset?.assetId;

  // isSolanaChainId is added here for evmCheck as native sol token has valid evm address in extension
  const isEvmSendType = useMemo(
    () =>
      address && asset?.chainId
        ? isEvmAddress(address) && !isSolanaChainId(asset?.chainId)
        : undefined,
    [address, asset?.chainId],
  );
  const isSolanaSendType = useMemo(
    () => (chainId ? isSolanaChainId(chainId) : undefined),
    [chainId],
  );
  const assetIsNative = asset ? isNativeAddress(address) : undefined;

  return useMemo(
    () => ({
      isEvmSendType,
      isEvmNativeSendType: isEvmSendType && assetIsNative,
      isNonEvmSendType: isSolanaSendType,
      isNonEvmNativeSendType: isSolanaSendType && assetIsNative,
      isSolanaSendType,
    }),
    [isEvmSendType, isSolanaSendType, assetIsNative],
  );
};
