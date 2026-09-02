import React from 'react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  getSecurityTrustBadgeConfig,
  SecurityTrustInlineBadge,
  type SecurityTrustTranslate,
} from '../../security-trust/security-trust-inline-badge';

export const SafetyBadge = ({ value }: { value?: string }) => {
  const t = useI18nContext() as SecurityTrustTranslate;
  const badge = getSecurityTrustBadgeConfig(value, t);

  if (!badge) {
    return null;
  }

  return <SecurityTrustInlineBadge badge={badge} testId="safety-badge" />;
};
