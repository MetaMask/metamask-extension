import { Json } from '@metamask/utils';
import { SECURITY_PROVIDER_MESSAGE_SEVERITY } from '../constants/security-provider';

export function isSuspiciousResponse(
  securityProviderResponse: Record<string, Json> | undefined,
): boolean {
  if (!securityProviderResponse) {
    return false;
  }

  const isFlagged =
    securityProviderResponse.flagAsDangerous !== undefined &&
    securityProviderResponse.flagAsDangerous !==
      SECURITY_PROVIDER_MESSAGE_SEVERITY.NOT_MALICIOUS;

  const isNotVerified = Object.keys(securityProviderResponse).length === 0;

  return isFlagged || isNotVerified;
}
