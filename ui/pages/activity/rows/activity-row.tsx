import React from 'react';
import type { ActivityRowProps } from '../types';
import { getActivityCellStatus } from '../helpers';
import { PendingActivityRow } from './pending-activity-row';
import { useActivityRowContent } from './useActivityRowContent';
import { ActivityRowLayout } from './activity-row-layout';

export function ActivityRow({ data, onClick }: Readonly<ActivityRowProps>) {
  const content = useActivityRowContent(data);
  const { txStatus } = getActivityCellStatus(data);

  if (data.status === 'pending') {
    return (
      <PendingActivityRow
        {...content}
        data={data}
        txStatus={txStatus}
        onClick={onClick}
      />
    );
  }

  return (
    <ActivityRowLayout {...content} txStatus={txStatus} onClick={onClick} />
  );
}
