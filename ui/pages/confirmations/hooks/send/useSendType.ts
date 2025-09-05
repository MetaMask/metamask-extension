import { isAddress as isEvmAddress } from 'ethers/lib/utils';
import { isNativeAddress, isSolanaChainId } from '@metamask/bridge-controller';
import { useMemo } from 'react';

import { useSendContext } from '../../context/send';

export const useSendType = () => {
  const { asset, chainId } = useSendContext();

  // isSolanaChainId is added here for evmCheck as native sol token has valid evm address in extension
  const isEvmSendType = useMemo(
    () =>
      asset?.address && asset?.chainId
        ? isEvmAddress(asset.address) && !isSolanaChainId(asset?.chainId)
        : undefined,
    [asset?.address, asset?.chainId],
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
