import React from 'react';
import { ActivityCell } from './activity-cell';
import { PendingActivityCell } from './pending-activity-cell';
import type { ActivityCellProps } from '../types';

export function ActivityListItem({
  data,
  onClick,
}: Readonly<ActivityCellProps>) {
  if (data.status === 'pending') {
    return <PendingActivityCell data={data} onClick={onClick} />;
  }

  return <ActivityCell data={data} onClick={onClick} />;
}
