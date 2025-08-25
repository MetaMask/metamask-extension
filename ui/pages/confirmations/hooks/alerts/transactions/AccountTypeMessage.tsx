import React from 'react';
import { ButtonLink, Text } from '../../../../../components/component-library';
import {
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import ZENDESK_URLS from '../../../../../helpers/constants/zendesk-url';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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
