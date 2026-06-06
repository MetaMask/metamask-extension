import React from 'react';
import {
  AvatarToken,
  AvatarTokenSize,
} from '@metamask/design-system-react';
import {
  applyDisplaySign,
  getDisplaySignPrefix,
  getHumanReadableTokenAmount,
} from '../../../../shared/lib/activity/fiat';
import type { TokenAmount } from '../../../../shared/lib/activity/types';
import { getAssetImageUrl } from '../../../../shared/lib/asset-utils';
import { useFormatters } from '../../../hooks/useFormatters';

export function TokenAmountRow({ token }: { token: TokenAmount }) {
  const { formatTokenAmount } = useFormatters();
  const humanAmount = getHumanReadableTokenAmount(token);
  const formattedAmount =
    humanAmount === undefined
      ? token.symbol
      : applyDisplaySign(
          formatTokenAmount(humanAmount as `${number}`, token.symbol ?? ''),
          getDisplaySignPrefix(token.direction, { showPlus: true }),
        );

  if (!formattedAmount) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 py-4">
      <AvatarToken
        size={AvatarTokenSize.Xl}
        name={token.symbol ?? '?'}
        src={getTokenImage(token)}
        imageProps={{ className: 'bg-alternative' }}
      />
      <p
        className={`text-l-heading-lg leading-l-heading-lg tracking-l-heading-lg font-semibold ${
          token.direction === 'in' ? 'text-success-default' : ''
        }`}
      >
        {formattedAmount}
      </p>
    </div>
  );
}

function getTokenImage(token: TokenAmount) {
  const { assetId } = token;

  if (!assetId) {
    return undefined;
  }

  try {
    const [chainId] = assetId.split('/');

    if (!chainId) {
      return undefined;
    }

    return getAssetImageUrl(
      assetId as `${string}:${string}/${string}:${string}`,
      chainId as `${string}:${string}`,
    );
  } catch {
    return undefined;
  }
}
