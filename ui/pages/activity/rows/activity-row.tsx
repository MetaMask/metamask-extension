import React from 'react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import type { ActivityRowProps } from '../types';
import { getActivityCellStatus } from '../helpers';
import { PendingActivityRow } from './pending-activity-row';
import { useActivityRowContent } from './useActivityRowContent';
import { ActivityRowLayout } from './activity-row-layout';

export function ActivityRow({ data, onClick }: Readonly<ActivityRowProps>) {
  const t = useI18nContext();
  const content = useActivityRowContent(data);
  const { txStatus, pendingSubtitleKey } = getActivityCellStatus(data);

  if (data.status === 'pending') {
    // Signing/queued transactions show their status in the subtitle, while an
    // actively pending transaction shows a loading spinner next to the title.
    const pendingStatusText = pendingSubtitleKey
      ? t(pendingSubtitleKey)
      : undefined;

    return (
      <PendingActivityRow
        {...content}
        data={data}
        txStatus={txStatus}
        pendingStatusText={pendingStatusText}
        showPendingSpinner={!pendingStatusText}
        onClick={onClick}
      />
    );
  }

  return (
    <ActivityRowLayout {...content} txStatus={txStatus} onClick={onClick} />
  );
}
