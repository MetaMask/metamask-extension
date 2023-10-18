import React from 'react';

import {
  TextVariant,
  FontWeight,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { BannerAlert, Text, ButtonLink } from '../../component-library';

const TransactionInsightsDeprecationAlert = () => {
  const t = useI18nContext();

  return (
    <BannerAlert className="confirm-data_alert">
      <Text variant={TextVariant.bodyMd} fontWeight={FontWeight.Medium}>
        {t('transactionInsightsDeprecationTitle')}
      </Text>
      <Text variant={TextVariant.bodySm}>
        {t('transactionInsightsDeprecationInfo')}{' '}
        <ButtonLink
          className="confirm-data_alert-snaps"
          fontWeight={FontWeight.Normal}
          target="_blank"
          href=" https://snaps.metamask.io/transaction-insights"
        >
          {t('snaps')}
        </ButtonLink>
        .
      </Text>
    </BannerAlert>
  );
};

export default TransactionInsightsDeprecationAlert;
