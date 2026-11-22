import React from 'react';
import { BannerAlert, BannerAlertSeverity } from '../../../component-library';

export type SnapUIBannerProps = {
  severity: BannerAlertSeverity | undefined;
  title: string;
};

export const SnapUIBanner = ({
  children,
  severity,
  title,
}: React.PropsWithChildren<SnapUIBannerProps>) => {
  return (
    <BannerAlert severity={severity} title={title}>
      {children}
    </BannerAlert>
  );
};
