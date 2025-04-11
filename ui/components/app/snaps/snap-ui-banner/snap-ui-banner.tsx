import type { FunctionComponent } from 'react';
import React from 'react';

import type { BannerAlertSeverity } from '../../../component-library';
import { BannerAlert } from '../../../component-library';

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
