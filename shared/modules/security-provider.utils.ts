import { Json } from '@metamask/utils';
import { SECURITY_PROVIDER_MESSAGE_SEVERITY } from '../constants/security-provider';

export function isSuspiciousResponse(
  securityProviderResponse: Record<string, Json>,
): boolean {
  return (
    (securityProviderResponse?.flagAsDangerous !== undefined &&
      securityProviderResponse?.flagAsDangerous !==
        SECURITY_PROVIDER_MESSAGE_SEVERITY.NOT_MALICIOUS) ||
    (securityProviderResponse &&
      Object.keys(securityProviderResponse).length === 0)
  );
}
