import React from 'react';
import { PendingActivityCell } from './pending-activity-cell';
import type { ActivityCellProps } from '../types';
import { getActivityCellStatus } from '../helpers';
import { useActivityCellPresentation } from './useActivityCellPresentation';
import { ActivityCellBase } from './activity-cell-base';

export function ActivityListItem({
  data,
  onClick,
}: Readonly<ActivityCellProps>) {
  const cellStatus = getActivityCellStatus(data);
  const presentation = useActivityCellPresentation(data);

  if (data.status === 'pending') {
    return (
      <PendingActivityCell
        {...presentation}
        data={data}
        txStatus={cellStatus.txStatus}
        onClick={onClick}
      />
    );
  }

  return (
    <ActivityCellBase
      {...presentation}
      txStatus={cellStatus.txStatus}
      onClick={onClick}
    />
  );
}
