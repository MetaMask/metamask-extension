import React from 'react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { TokenActivityDetails } from '../components/token-activity-details';

export function ApprovalDetails({
  item,
}: {
  item: Extract<
    ActivityListItem,
    {
      type: 'approveSpendingCap' | 'revokeSpendingCap' | 'increaseSpendingCap';
    }
  >;
}) {
  return <TokenActivityDetails item={item} />;
}
