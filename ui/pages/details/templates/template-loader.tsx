import React from 'react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { ApprovalDetails } from './approval-details';
import { DefaultDetails } from './default-details';
import { SendDetails } from './send-details';
import { SwapDetails } from './swap-details';

type Props = {
  item: ActivityListItem | undefined;
};

export function TemplateLoader({ item }: Props) {
  if (!item) {
    return null;
  }

  switch (item.type) {
    case 'send':
    case 'receive':
      return <SendDetails item={item} />;
    case 'swap':
    case 'convert':
    case 'lendingDeposit':
    case 'lendingWithdrawal':
    case 'wrap':
    case 'unwrap':
    case 'bridge':
      return <SwapDetails item={item} />;
    case 'approveSpendingCap':
    case 'revokeSpendingCap':
    case 'increaseSpendingCap':
      return <ApprovalDetails item={item} />;
    default:
      return <DefaultDetails item={item} />;
  }
}
