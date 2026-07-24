import type { TokenSecurityData } from '@metamask/assets-controllers';
import type { ResultTypeConfig } from '../../utils/security-utils';
import type {
  SecurityTrustSheetParams,
  SecurityTrustSheetSource,
} from './security-trust-sheet-types';

export const shouldGateSecurityTrustCta = (
  resultType: TokenSecurityData['resultType'] | undefined,
): boolean =>
  resultType === 'Malicious' ||
  resultType === 'Warning' ||
  resultType === 'Spam';

/**
 * Builds modal params for Buy/Swap CTA gating (Continue anyway / Cancel).
 *
 * @param securityData - Token security data from the assets API.
 * @param securityConfig - Result-type display configuration.
 * @param tokenSymbol - Token symbol for sheet copy.
 * @param onProceed - Callback when the user chooses Continue anyway.
 * @param source - CTA source (`buy` or `swap`).
 */
export const getSecurityTrustCtaSheetParams = (
  securityData: TokenSecurityData,
  securityConfig: ResultTypeConfig,
  tokenSymbol: string | undefined,
  onProceed: () => void,
  source: SecurityTrustSheetSource,
): SecurityTrustSheetParams | null => {
  if (!shouldGateSecurityTrustCta(securityData.resultType)) {
    return null;
  }

  if (
    !securityConfig.icon ||
    !securityConfig.iconColor ||
    !securityConfig.sheetTitle ||
    !securityConfig.getSheetDescription
  ) {
    return null;
  }

  return {
    severity: securityData.resultType as SecurityTrustSheetParams['severity'],
    securityConfig,
    title: securityConfig.sheetTitle,
    description: securityConfig.getSheetDescription(tokenSymbol),
    displayIcon: securityConfig.icon,
    displayIconColor: securityConfig.iconColor,
    tokenSymbol,
    features: securityData.features,
    onProceed,
    source,
  };
};
