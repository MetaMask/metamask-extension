import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  BannerAlert,
  ButtonLink,
  Text,
  BannerAlertSeverity,
} from '../../../../components/component-library';
import {
  shouldShowSmartTransactionsMigrationAlert,
  dismissAndDisableAlert,
} from '../../../../ducks/alerts/smart-transactions-migration';
import { SMART_TRANSACTIONS_LEARN_MORE_URL } from '../../../../../shared/constants/smartTransactions';

const SmartTransactionsBannerAlert = () => {
  const dispatch = useDispatch();
  const shouldShow = useSelector(shouldShowSmartTransactionsMigrationAlert);

  const t = useI18nContext();

  if (!shouldShow) {
    return null;
  }

  return (
    <BannerAlert
      severity={BannerAlertSeverity.Info}
      onClose={() => {
        console.log('Dismiss clicked');
        dispatch(dismissAndDisableAlert());
      }}
      data-testid="smart-transactions-banner-alert"
    >
      <Text as="p">
        {t('smartTransactionsEnabled')}
        <ButtonLink
          href={SMART_TRANSACTIONS_LEARN_MORE_URL}
          onClick={() => dispatch(dismissAndDisableAlert())}
          externalLink
        >
          {t('learnMore')}
        </ButtonLink>
      </Text>
    </BannerAlert>
  );
};

export default SmartTransactionsBannerAlert;
