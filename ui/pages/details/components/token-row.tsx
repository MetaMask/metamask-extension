import React, { useMemo } from 'react';
import { Text } from '@metamask/design-system-react';
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

function formatTokenRowAmount({
  token,
  humanAmount,
  amountPlaceholder,
  formatToken,
}: {
  token: TokenAmount;
  humanAmount: string | undefined;
  amountPlaceholder?: string;
  formatToken: ReturnType<typeof useFormatters>['formatToken'];
}): string | undefined {
  if (
    amountPlaceholder !== undefined &&
    (humanAmount === undefined || Number(humanAmount) <= 0)
  ) {
    return `${amountPlaceholder}${token.symbol ? ` ${token.symbol}` : ''}`;
  }
  if (humanAmount === undefined) {
    return token.symbol;
  }
  return applyDisplaySign(
    token.symbol
      ? formatToken(humanAmount as `${number}`, token.symbol, {
          maximumFractionDigits,
        })
      : humanAmount,
    getDisplaySignPrefix(token.direction, { showPlus: true }),
  );
}

export function TokenRow({
  token,
  showNetworkBadge,
  amountPlaceholder,
}: {
  token: TokenAmount;
  showNetworkBadge?: boolean;
  amountPlaceholder?: string;
}) {
  const { formatToken } = useFormatters();
  const humanAmount = getHumanReadableTokenAmount(token);
  const formattedAmount = formatTokenRowAmount({
    token,
    humanAmount,
    amountPlaceholder,
    formatToken,
  });

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
      <Text
        variant="heading-lg"
        color={
          token.direction === 'in' ? 'text-success-default' : 'text-default'
        }
        data-testid="transaction-list-item-primary-currency"
      >
        {formattedAmount}
      </Text>
    </div>
  );
}
