import React from 'react';
import { Text } from '../../../../../components/component-library';
import { TextVariant } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import ZENDESK_URLS from '../../../../../helpers/constants/zendesk-url';

export const PendingTransactionAlertMessage = () => {
  const t = useI18nContext();

  return (
    <Text
      variant={TextVariant.bodyMd}
      data-testid="alert-modal__selected-alert"
    >
      {t('pendingTransactionAlertMessage', [
        <a
          href={ZENDESK_URLS.SPEEDUP_CANCEL}
          key="link"
          target="_blank"
          rel="noreferrer noopener"
        >
          {t('pendingTransactionAlertMessageHyperlink')}
        </a>,
      ])}
    </Text>
  );
};
