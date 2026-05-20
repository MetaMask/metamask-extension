import { isAddress as isEvmAddress } from 'ethers/lib/utils';
import {
  isBitcoinChainId,
  isSolanaChainId,
  isStellarChainId,
} from '@metamask/bridge-controller';
import { useMemo } from 'react';

import { useSendContext } from '../../context/send';
import { isTronChainId } from '../../utils/network';

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
  const isBitcoinSendType = useMemo(
    () => (chainId ? isBitcoinChainId(chainId) : undefined),
    [chainId],
  );
  const isTronSendType = useMemo(
    () => (chainId ? isTronChainId(chainId) : undefined),
    [chainId],
  );
  const isStellarSendType = useMemo(
    () => (chainId ? isStellarChainId(chainId) : undefined),
    [chainId],
  );

  const assetIsNative = asset ? asset?.isNative === true : undefined;

  return useMemo(
    () => ({
      isBitcoinSendType,
      isEvmSendType,
      isEvmNativeSendType: isEvmSendType && assetIsNative,
      isNonEvmSendType:
        isSolanaSendType ||
        isBitcoinSendType ||
        isTronSendType ||
        isStellarSendType,
      isNonEvmNativeSendType:
        (isSolanaSendType && assetIsNative) ||
        (isBitcoinSendType && assetIsNative) ||
        (isTronSendType && assetIsNative) ||
        (isStellarSendType && assetIsNative),
      isSolanaSendType,
      isStellarSendType,
      isTronSendType,
    }),
    [
      isEvmSendType,
      isSolanaSendType,
      assetIsNative,
      isBitcoinSendType,
      isTronSendType,
      isStellarSendType,
    ],
  );
};
