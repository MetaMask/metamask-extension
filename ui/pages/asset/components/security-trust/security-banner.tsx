import React from 'react';
import { BannerAlert, BannerAlertSeverity } from '@metamask/design-system-react';
import type { ResultTypeConfig } from '../../utils/security-utils';

export type SecurityBannerProps = {
  securityConfig: ResultTypeConfig;
  severity: BannerAlertSeverity;
  testId: string;
  title?: string;
  description: string;
  onClick?: () => void;
};

export const SecurityBanner = ({
  securityConfig,
  severity,
  testId,
  title,
  description,
  onClick,
}: SecurityBannerProps) => {
  const banner = (
    <BannerAlert
      data-testid={onClick ? undefined : testId}
      severity={severity}
      title={title ?? securityConfig.label}
      description={description}
    />
  );

  if (!onClick) {
    return banner;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className="w-full cursor-pointer border-0 bg-transparent p-0 text-left"
    >
      {banner}
    </button>
  );
};
