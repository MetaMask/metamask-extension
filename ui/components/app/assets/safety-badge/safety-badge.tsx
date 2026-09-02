import React from 'react';
import { useSelector } from 'react-redux';
import { getUseExternalServices } from '../../../../selectors';
import { getIsSecurityTrustTdpEnabled } from '../../../../selectors/multichain/feature-flags';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useTokenAssetQuery } from '../../../../hooks/token-asset/useTokenAssetQuery';
import {
  getSecurityTrustBadgeConfig,
  SecurityTrustInlineBadge,
  type SecurityTrustTranslate,
} from '../../security-trust/security-trust-inline-badge';

export const SafetyBadge = ({ assetId }: { assetId?: string }) => {
  const t = useI18nContext() as SecurityTrustTranslate;
  const allowExternalServices = useSelector(getUseExternalServices);
  const isTokenSafetyEnabled = useSelector(getIsSecurityTrustTdpEnabled);
  const { data } = useTokenAssetQuery({
    assetId,
    fetchOnMiss: false,
  });

  if (!allowExternalServices || !isTokenSafetyEnabled) {
    return null;
  }

  const badge = getSecurityTrustBadgeConfig(data?.securityData?.resultType, t);

  if (!badge) {
    return null;
  }

  return (
    <span className="flex-shrink-0">
      <SecurityTrustInlineBadge badge={badge} testId="safety-badge" />
    </span>
  );
};
