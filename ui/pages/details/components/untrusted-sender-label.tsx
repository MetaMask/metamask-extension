import React from 'react';
import { Tag, TagSeverity } from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';

export function UntrustedSenderLabel() {
  const t = useI18nContext();

  return (
    <Tag
      severity={TagSeverity.Warning}
      data-testid="activity-untrusted-sender-label"
      className="shrink-0 whitespace-nowrap"
    >
      {t('activityUntrustedSenderBadge')}
    </Tag>
  );
}
