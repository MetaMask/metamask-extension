import React, { useMemo } from 'react';
import {
  formatChainIdToHex,
  isNonEvmChainId,
} from '@metamask/bridge-controller';
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

export function TokenAmountRow({
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

  const hexChainId = useMemo(() => {
    if (!showNetworkBadge || !token.assetId) {
      return undefined;
    }
    const caipChainId = token.assetId.split('/')[0];
    if (!caipChainId || isNonEvmChainId(caipChainId)) {
      return caipChainId;
    }
    return formatChainIdToHex(caipChainId);
  }, [showNetworkBadge, token.assetId]);

  if (!formattedAmount) {
    return null;
  }

  const avatar = <ActivityAvatar tokens={[token.assetId]} />;

  return (
    <div className="flex items-center gap-4 py-4">
      {hexChainId ? (
        <ChainBadge chainId={hexChainId}>{avatar}</ChainBadge>
      ) : (
        avatar
      )}
      <p
        className={`text-l-heading-lg leading-l-heading-lg tracking-l-heading-lg font-semibold ${
          token.direction === 'in' ? 'text-success-default' : ''
        }`}
        data-testid="transaction-list-item-primary-currency"
      >
        {formattedAmount}
      </p>
    </div>
  );
}
