import React from 'react';
import { TextButton } from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { CONSENSYS_PRIVACY_LINK } from '../../../../shared/lib/ui-utils';

export const PrivacyPolicyLink = () => {
  const t = useI18nContext();

  return (
    <TextButton asChild>
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
