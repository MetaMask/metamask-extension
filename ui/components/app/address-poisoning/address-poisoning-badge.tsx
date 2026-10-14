import React from 'react';
import { Tag, TagSeverity } from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';

export function AddressPoisoningBadge() {
  const t = useI18nContext();

  return (
    <Tag
      className="ms-2 shrink-0"
      data-testid="address-poisoning-badge"
      severity={TagSeverity.Danger}
    >
      {t('addressPoisoningBadge')}
    </Tag>
  );
}
