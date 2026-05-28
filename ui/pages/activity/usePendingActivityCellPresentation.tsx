import React from 'react';
import { Icon, IconName, IconSize, Text } from '@metamask/design-system-react';
import { StatusIcon } from '../../components/ui/icon/status-icon';
import { useI18nContext } from '../../hooks/useI18nContext';
import type { ActivityCellProps } from './cells/types';
import { useActivityCellPresentation } from './useActivityCellPresentation';

function renderPendingSubtitle({
  pendingText,
  subtitle,
}: {
  pendingText: string;
  subtitle?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-1">
      <Icon
        name={IconName.Clock}
        size={IconSize.Xs}
        className="shrink-0 text-alternative"
      />
      <Text variant="body-sm" className="shrink-0 text-alternative">
        {pendingText}
      </Text>
      {subtitle ? (
        <>
          <Text variant="body-sm" className="shrink-0 text-alternative">
            •
          </Text>
          {subtitle}
        </>
      ) : null}
    </div>
  );
}

function renderTitleWithSpinner(title: React.ReactNode) {
  return (
    <>
      {title}
      <span
        className="shrink-0"
        data-testid="activity-list-item-pending-spinner"
      >
        <StatusIcon state="loading" className="w-5 h-5" />
      </span>
    </>
  );
}

export function usePendingActivityCellPresentation(
  activity: ActivityCellProps['data'],
  pendingSubtitleKey?: string,
) {
  const t = useI18nContext();
  const presentation = useActivityCellPresentation(activity);

  if (pendingSubtitleKey) {
    return {
      ...presentation,
      subtitle: renderPendingSubtitle({
        pendingText: t(pendingSubtitleKey),
        subtitle: presentation.subtitle,
      }),
    };
  }

  return {
    ...presentation,
    title: renderTitleWithSpinner(presentation.title),
  };
}
