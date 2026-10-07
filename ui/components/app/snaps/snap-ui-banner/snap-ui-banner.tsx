import React from 'react';
import { BannerAlert } from '../../../component-library/banner-alert/banner-alert';
import { BannerAlertSeverity } from '../../../component-library/banner-alert/banner-alert.types';

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
