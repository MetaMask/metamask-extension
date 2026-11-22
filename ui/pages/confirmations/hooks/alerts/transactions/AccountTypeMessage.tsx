import React from 'react';
import { ButtonLink, Text } from '../../../../../components/component-library';
import {
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import ZENDESK_URLS from '../../../../../helpers/constants/zendesk-url';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

export function AccountTypeMessage() {
  const t = useI18nContext();

  return (
    <Text variant={TextVariant.bodyMd} color={TextColor.textDefault}>
      {t('alertAccountTypeUpgradeMessage', [
        <ButtonLink
          href={ZENDESK_URLS.ACCOUNT_UPGRADE}
          key="link"
          target="_blank"
          rel="noreferrer noopener"
          color={TextColor.primaryDefault}
        >
          {t('learnMoreUpperCase')}
        </ButtonLink>,
      ])}
    </Text>
  );
}
