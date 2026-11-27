import React from 'react';
import { TextButton } from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { CONSENSYS_PRIVACY_LINK } from '../../../../shared/lib/ui-utils';

type PrivacyPolicyLinkProps = {
  /**
   * Locale key for the link label. Defaults to the shared Privacy Policy
   * label so other surfaces keep `privacyMsg`.
   */
  messageKey?: string;
};

export const PrivacyPolicyLink = ({
  messageKey = 'privacyMsg',
}: PrivacyPolicyLinkProps) => {
  const t = useI18nContext();

  return (
    <TextButton asChild>
      <a
        href={CONSENSYS_PRIVACY_LINK}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t(messageKey)}
      </a>
    </TextButton>
  );
};
