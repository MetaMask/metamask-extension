import React from 'react';
import type { ActivityRowProps } from '../types';
import { useActivityCellStatus } from '../helpers';
import { PendingActivityRow } from './pending-activity-row';
import { useActivityRowContent } from './useActivityRowContent';
import { ActivityRowLayout } from './activity-row-layout';

const ResolvedActivityRow = ({ data, onClick }: Readonly<ActivityRowProps>) => {
  const content = useActivityRowContent(data);
  const { txStatus } = useActivityCellStatus(data);

  return (
    <ActivityRowLayout {...content} txStatus={txStatus} onClick={onClick} />
  );
};

export function ActivityRow({ data, onClick }: Readonly<ActivityRowProps>) {
  if (data.status === 'pending') {
    return <PendingActivityRow data={data} onClick={onClick} />;
  }

  return <ResolvedActivityRow data={data} onClick={onClick} />;
}
