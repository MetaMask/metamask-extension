import React from 'react';
import { BannerAlert, BannerAlertSeverity } from '@metamask/design-system-react';
import type { ResultTypeConfig } from '../../utils/security-utils';

export type SecurityBannerProps = {
  securityConfig: ResultTypeConfig;
  severity: BannerAlertSeverity;
  testId: string;
  title?: string;
  description: string;
};

export const SecurityBanner = ({
  securityConfig,
  severity,
  testId,
  title,
  description,
}: SecurityBannerProps) => (
  <BannerAlert
    data-testid={testId}
    severity={severity}
    title={title ?? securityConfig.label}
    description={description}
  />
);
