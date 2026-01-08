import { useMemo } from 'react';
import { type Asset } from '../../types/send';
import { useSendTokens } from './useSendTokens';
import { useSendNfts } from './useSendNfts';

type SendAssets = {
  nfts: Asset[];
  tokens: Asset[];
};

export const useSendAssets = (): SendAssets => {
  const tokens = useSendTokens();
  const nfts = useSendNfts();

  return useMemo(
    () => ({
      tokens,
      nfts,
    }),
    [tokens, nfts],
  );
};
