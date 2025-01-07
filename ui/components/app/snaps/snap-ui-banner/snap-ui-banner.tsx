import React, { FunctionComponent } from 'react';
import { BannerAlert, BannerAlertSeverity } from '../../../component-library';

export type SnapUIBannerProps = {
  severity: BannerAlertSeverity | undefined;
  title: string;
};

export const SnapUIBanner: FunctionComponent<SnapUIBannerProps> = ({
  children,
  severity,
  title,
}) => {
  return (
    <BannerAlert severity={severity} title={title}>
      {children}
    </BannerAlert>
  );
};
