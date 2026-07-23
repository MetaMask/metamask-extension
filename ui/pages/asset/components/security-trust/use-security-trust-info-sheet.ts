import type { TokenSecurityData } from '@metamask/assets-controllers';
import type { ResultTypeConfig } from '../../utils/security-utils';
import type { SecurityTrustSheetParams } from './security-trust-sheet-types';

type SheetSeverity = SecurityTrustSheetParams['severity'];

const isSheetSeverity = (
  resultType: string | undefined,
  securityConfig: ResultTypeConfig,
): resultType is SheetSeverity =>
  Boolean(
    resultType &&
      resultType !== 'Benign' &&
      securityConfig.icon &&
      securityConfig.iconColor &&
      securityConfig.sheetTitle &&
      securityConfig.getSheetDescription,
  );

/**
 * Builds modal params for badge/banner informational taps (Got it only).
 */
export const getSecurityTrustInfoSheetParams = (
  securityData: TokenSecurityData,
  securityConfig: ResultTypeConfig,
  tokenSymbol: string | undefined,
): SecurityTrustSheetParams | null => {
  const { resultType } = securityData;

  if (!isSheetSeverity(resultType, securityConfig)) {
    return null;
  }

  const isVerified = resultType === 'Verified';
  const displayIcon =
    isVerified && securityConfig.badge
      ? securityConfig.badge.icon
      : securityConfig.icon;
  const displayIconColor =
    isVerified && securityConfig.badge
      ? securityConfig.badge.iconColor
      : securityConfig.iconColor;

  if (!displayIcon || !displayIconColor || !securityConfig.sheetTitle) {
    return null;
  }

  return {
    severity: resultType,
    securityConfig,
    title: securityConfig.sheetTitle,
    description: securityConfig.getSheetDescription?.(tokenSymbol) ?? '',
    displayIcon,
    displayIconColor,
    tokenSymbol,
    features: securityData.features,
    source: 'badge',
  };
};
