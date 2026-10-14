import React from 'react';
import { Text } from '@metamask/design-system-react';
import type { ActivityListItem } from '../../../../../shared/lib/activity/types';
import { ActivityAvatar } from '../../../../components/app/activity-list-item-avatar';
import { formatPendingRampTokenLabel } from '../../../../hooks/ramps/utils/formatPendingRampTokenLabel';
import { hasPositiveNumericAmount } from '../../../../hooks/ramps/utils/hasPositiveNumericAmount';
import { TokensSection } from '../../components/sections';

type RampOrderItem = Extract<
  ActivityListItem,
  { type: 'rampBuy' | 'rampSell' }
>;

/**
 * Token amount section for ramps details. Pending orders without a known
 * crypto amount show an ellipsis label instead of a zero amount.
 *
 * @param props - Component props.
 * @param props.item - Mapped ramp activity item.
 * @returns The ramps tokens section.
 */
export function RampTokensSection({ item }: { item: RampOrderItem }) {
  const { token } = item.data;
  const showPendingPlaceholder =
    item.status === 'pending' && !hasPositiveNumericAmount(token?.amount);

  if (!token) {
    return null;
  }

  if (showPendingPlaceholder) {
    return (
      <div className="flex flex-col gap-2 pb-4">
        <div className="flex items-center gap-2">
          <ActivityAvatar tokens={[token.assetId]} />
          <Text
            variant="heading-lg"
            color={
              token.direction === 'in' ? 'text-success-default' : 'text-default'
            }
            data-testid="transaction-list-item-primary-currency"
          >
            {formatPendingRampTokenLabel(token.symbol)}
          </Text>
        </div>
      </div>
    );
  }

  return <TokensSection tokens={[{ token }]} />;
}
