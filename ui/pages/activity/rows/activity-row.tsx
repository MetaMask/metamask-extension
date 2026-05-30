import React from 'react';
import type { ActivityRowProps } from '../types';
import { getActivityCellStatus } from '../helpers';
import { PendingActivityRow } from './pending-activity-row';
import { useActivityRowContent } from './useActivityRowContent';
import { ActivityRowLayout } from './activity-row-layout';

export function ActivityRow({ data, onClick }: Readonly<ActivityRowProps>) {
  const cellStatus = getActivityCellStatus(data);
  const presentation = useActivityRowContent(data);

  if (data.status === 'pending') {
    return (
      <PendingActivityRow
        {...presentation}
        data={data}
        txStatus={cellStatus.txStatus}
        onClick={onClick}
      />
    );
  }

  return (
    <ActivityRowLayout
      {...presentation}
      txStatus={cellStatus.txStatus}
      onClick={onClick}
    />
  );
}
