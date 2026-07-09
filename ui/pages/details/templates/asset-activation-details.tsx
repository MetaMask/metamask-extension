import React from 'react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { TokenActivityDetails } from '../components/token-activity-details';

export function AssetActivationDetails({
  item,
}: {
  item: Extract<
    ActivityListItem,
    {
      type: 'assetActivation' | 'assetDeactivation';
    }
  >;
}) {
  return <TokenActivityDetails item={item} />;
}
