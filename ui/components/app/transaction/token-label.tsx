import React from 'react';
import { AvatarToken, AvatarTokenSize } from '@metamask/design-system-react';
import type { CaipAssetType, CaipChainId } from '@metamask/utils';
import { getCaipAssetImageUrl } from '../../../../shared/lib/asset-utils';
import { ChainBadge } from '../chain-badge/chain-badge';

type Props = {
  assetId?: CaipAssetType;
  symbol?: string;
};

export function TokenLabel({ assetId, symbol }: Props) {
  const src = getCaipAssetImageUrl(assetId);
  const chainId = assetId?.split('/')[0] as CaipChainId;

  return (
    <span className="inline-flex items-center gap-2">
      {src ? (
        <ChainBadge chainId={chainId}>
          <AvatarToken
            className="rounded"
            size={AvatarTokenSize.Xs}
            name={symbol}
            src={src}
          />
        </ChainBadge>
      ) : null}
      {symbol ? <span>{symbol}</span> : null}
    </span>
  );
}
