import { isAddress as isEvmAddress } from 'ethers/lib/utils';
import { isNativeAddress, isSolanaChainId } from '@metamask/bridge-controller';
import { useMemo } from 'react';

import { useSendContext } from '../../context/send';

export const useSendType = () => {
  const { asset, chainId } = useSendContext();

  const isEvmSendType = useMemo(
    () => (asset?.address ? isEvmAddress(asset.address) : undefined),
    [asset?.address],
  );
  const isSolanaSendType = useMemo(
    () => (chainId ? isSolanaChainId(chainId) : undefined),
    [chainId],
  );
  const assetIsNative = asset ? isNativeAddress(asset.address) : undefined;

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
