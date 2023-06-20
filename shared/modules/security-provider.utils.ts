import { Json } from '@metamask/utils';
import { SECURITY_PROVIDER_MESSAGE_SEVERITIES } from '../../ui/components/app/security-provider-banner-message/security-provider-banner-message.constants';

export function isFlaggedSecurityProviderResponse(
  securityProviderResponse: Record<string, Json>,
): boolean {
  return (
    (securityProviderResponse?.flagAsDangerous !== undefined &&
      securityProviderResponse?.flagAsDangerous !==
        SECURITY_PROVIDER_MESSAGE_SEVERITIES.NOT_MALICIOUS) ||
    (securityProviderResponse &&
      Object.keys(securityProviderResponse).length === 0)
  );
}
