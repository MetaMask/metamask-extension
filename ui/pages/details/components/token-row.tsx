import React, { useMemo } from 'react';
import { Text } from '@metamask/design-system-react';
import type { CaipChainId } from '@metamask/utils';
import { KnownCaipNamespace, parseCaipChainId } from '@metamask/utils';
import {
  applyDisplaySign,
  getDisplaySignPrefix,
  getHumanReadableTokenAmount,
} from '../../../../shared/lib/activity/fiat';
import type { TokenAmount } from '../../../../shared/lib/activity/types';
import { ActivityAvatar } from '../../../components/app/activity-list-item-avatar';
import { ChainBadge } from '../../../components/app/chain-badge/chain-badge';
import { convertCaipToHexChainId } from '../../../../shared/lib/network.utils';
import { useFormatters } from '../../../hooks/useFormatters';

const maximumFractionDigits = 8;

export function TokenRow({
  token,
  showNetworkBadge,
  chainId: activityChainId,
}: {
  token: TokenAmount;
  showNetworkBadge?: boolean;
  // The transfer's own chainId, used to resolve a native asset's icon when
  // it has no assetId - see activity-list-item-avatar.tsx.
  chainId?: CaipChainId;
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

  const badgeChainId = useMemo(() => {
    if (!showNetworkBadge || !token.assetId) {
      return undefined;
    }
    return token.assetId.split('/')[0] as CaipChainId;
  }, [showNetworkBadge, token.assetId]);

  const nativeIconChainId = useMemo(() => {
    if (!activityChainId) {
      return undefined;
    }
    return parseCaipChainId(activityChainId).namespace ===
      KnownCaipNamespace.Eip155
      ? convertCaipToHexChainId(activityChainId)
      : activityChainId;
  }, [activityChainId]);

  if (!formattedAmount) {
    return null;
  }

  const avatar = (
    <ActivityAvatar
      tokens={[
        token.assetId || token.assetType === 'native'
          ? { assetId: token.assetId, isNative: token.assetType === 'native' }
          : undefined,
      ]}
      chainId={nativeIconChainId}
    />
  );

  return (
    <div className="flex items-center gap-2">
      <ChainBadge chainId={badgeChainId}>{avatar}</ChainBadge>
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
