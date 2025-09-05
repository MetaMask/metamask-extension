import { isAddress as isEvmAddress } from 'ethers/lib/utils';
import { isNativeAddress, isSolanaChainId } from '@metamask/bridge-controller';
import { useMemo } from 'react';

import { useSendContext } from '../../context/send';

export const useSendType = () => {
  const { asset } = useSendContext();

  const isEvmSendType = useMemo(
    () => (asset?.address ? isEvmAddress(asset.address) : undefined),
    [asset?.address],
  );
  const isSolanaSendType = useMemo(
    () => (asset?.chainId ? isSolanaChainId(asset.chainId) : undefined),
    [asset?.chainId],
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
