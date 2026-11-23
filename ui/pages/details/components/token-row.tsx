import React, { useMemo } from 'react';
import cn from 'clsx';
import type { CaipChainId } from '@metamask/utils';
import {
  applyDisplaySign,
  getDisplaySignPrefix,
  getHumanReadableTokenAmount,
} from '../../../../shared/lib/activity/fiat';
import type { TokenAmount } from '../../../../shared/lib/activity/types';
import { ActivityAvatar } from '../../../components/app/activity-list-item-avatar';
import { ChainBadge } from '../../../components/app/chain-badge/chain-badge';
import { useFormatters } from '../../../hooks/useFormatters';

const maximumFractionDigits = 8;

export function TokenRow({
  token,
  showNetworkBadge,
}: {
  token: TokenAmount;
  showNetworkBadge?: boolean;
}) {
  const { formatToken } = useFormatters();
  const humanAmount = getHumanReadableTokenAmount(token);
  const formattedAmount =
    humanAmount === undefined
      ? token.symbol
      : applyDisplaySign(
          token.symbol
            ? formatToken(humanAmount as `${number}`, token.symbol, {
                maximumFractionDigits,
              })
            : humanAmount,
          getDisplaySignPrefix(token.direction, { showPlus: true }),
        );

  const chainId = useMemo(() => {
    if (!showNetworkBadge || !token.assetId) {
      return undefined;
    }
    return token.assetId.split('/')[0] as CaipChainId;
  }, [showNetworkBadge, token.assetId]);

  if (!formattedAmount) {
    return null;
  }

  const avatar = <ActivityAvatar tokens={[token.assetId]} />;

  return (
    <div className="flex items-center gap-2">
      <ChainBadge chainId={chainId}>{avatar}</ChainBadge>
      <h2
        className={cn(
          'text-s-heading-lg font-bold leading-8',
          token.direction === 'in' ? 'text-success-default' : 'text-default',
        )}
        data-testid="transaction-list-item-primary-currency"
      >
        {formattedAmount}
      </h2>
    </div>
  );
}
