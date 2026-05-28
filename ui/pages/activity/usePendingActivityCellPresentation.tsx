import React from 'react';
import { Icon, IconName, IconSize } from '@metamask/design-system-react';
import { StatusIcon } from '../../components/ui/icon/status-icon';
import { useI18nContext } from '../../hooks/useI18nContext';
import type { ActivityCellProps } from './cells/types';
import { useActivityCellPresentation } from './useActivityCellPresentation';

export function usePendingActivityCellPresentation(
  activity: ActivityCellProps['data'],
  pendingSubtitleKey?: string,
) {
  const t = useI18nContext();
  const presentation = useActivityCellPresentation(activity);

  if (pendingSubtitleKey) {
    return {
      ...presentation,
      subtitle: (
        <>
          <Icon
            name={IconName.Clock}
            size={IconSize.Xs}
            className="shrink-0 text-alternative"
          />
          <span className="shrink-0">{t(pendingSubtitleKey)}</span>
          {presentation.subtitle ? (
            <>
              <span className="shrink-0">•</span>
              {presentation.subtitle}
            </>
          ) : null}
        </>
      ),
    };
  }

  return {
    ...presentation,
    title: (
      <>
        {presentation.title}
        <span
          className="shrink-0"
          data-testid="activity-list-item-pending-spinner"
        >
          <StatusIcon state="loading" className="w-5 h-5" />
        </span>
      </>
    ),
  };
}
