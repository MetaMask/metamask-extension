import React from 'react';
import { ButtonLink, Text } from '../../../../../components/component-library';
import {
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import ZENDESK_URLS from '../../../../../helpers/constants/zendesk-url';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useDispatch } from 'react-redux';
import { dismissAndDisableAlert } from '../../../../../ducks/alerts/stx-migration';

export const SmartTransactionsAlertMessage = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  return (
    <Text
      variant={TextVariant.bodyMd}
      color={TextColor.textDefault}
    >
        <ButtonLink
          href={ZENDESK_URLS.SMART_TRANSACTIONS_LEARN_MORE}
          key="link"
          target="_blank"
          rel="noreferrer noopener"
          color={TextColor.primaryDefault}
          onClick={() => {
            dispatch(dismissAndDisableAlert());
          }}
        >
          {'Learn more about Smart Transactions'}
        </ButtonLink>
    </Text>
  );
};