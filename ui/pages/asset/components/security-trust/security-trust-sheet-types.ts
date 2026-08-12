import type { TokenSecurityFeature } from '@metamask/assets-controllers';
import type { IconColor, IconName } from '@metamask/design-system-react';
import type { ResultTypeConfig } from '../../utils/security-utils';

export type SecurityTrustSheetSeverity =
  | 'Verified'
  | 'Warning'
  | 'Spam'
  | 'Malicious';

export type SecurityTrustSheetSource = 'badge' | 'buy' | 'swap';

export type SecurityTrustSheetParams = {
  severity: SecurityTrustSheetSeverity;
  securityConfig: ResultTypeConfig;
  title: string;
  description: string;
  displayIcon: IconName;
  displayIconColor: IconColor;
  tokenSymbol?: string;
  features?: TokenSecurityFeature[];
  onProceed?: () => void;
  source: SecurityTrustSheetSource;
};
