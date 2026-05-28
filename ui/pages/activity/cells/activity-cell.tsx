import React from 'react';
import { getActivityCellStatus } from '../helpers';
import { useActivityCellPresentation } from '../useActivityCellPresentation';
import { ActivityCellBase } from './activity-cell-base';
import type { ActivityCellProps } from './types';

export function ActivityCell({
  data,
  onClick,
}: Readonly<ActivityCellProps>) {
  const cellStatus = getActivityCellStatus(data);
  const presentation = useActivityCellPresentation(data);

  return (
    <ActivityCellBase
      {...presentation}
      txStatus={cellStatus.txStatus}
      onClick={onClick}
    />
  );
}
