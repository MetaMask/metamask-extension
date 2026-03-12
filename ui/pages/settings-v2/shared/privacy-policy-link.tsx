import React from 'react';
import { TextButton } from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { CONSENSYS_PRIVACY_LINK } from '../../../../shared/lib/ui-utils';

type PrivacyPolicyLinkProps = {
  key: string;
};

export const PrivacyPolicyLink = ({ key = 'privacy-policy-link' }: PrivacyPolicyLinkProps) => {
  const t = useI18nContext();

  return (
    <TextButton asChild key={key}>
      <a
        href={CONSENSYS_PRIVACY_LINK}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('privacyMsg')}
      </a>
    </TextButton>
  );
};
