import { IconName } from '@metamask/design-system-react';
import type { MetaMetricsEventPayload } from '../../../../shared/constants/metametrics';

export type WalletTypeOption = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  iconName: IconName;
  route: string;
  metricsEvent?: MetaMetricsEventPayload;
};
