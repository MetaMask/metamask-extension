import React from 'react';
import { ButtonLink, Text } from '../../../../../components/component-library';
import {
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import ZENDESK_URLS from '../../../../../helpers/constants/zendesk-url';

export const PendingTransactionAlertMessage = (
  t: (key: string, ...args: unknown[]) => string,
) => {
  return (
    <Text
      variant={TextVariant.bodyMd}
      color={TextColor.textDefault}
      data-testid="alert-modal__selected-alert"
    >
      {t('pendingTransactionAlertMessage', [
        <ButtonLink
          href={ZENDESK_URLS.SPEEDUP_CANCEL}
          key="link"
          target="_blank"
          rel="noreferrer noopener"
          color={TextColor.primaryDefault}
        >
          {t('pendingTransactionAlertMessageHyperlink')}
        </ButtonLink>,
      ])}
    </Text>
  );
};
