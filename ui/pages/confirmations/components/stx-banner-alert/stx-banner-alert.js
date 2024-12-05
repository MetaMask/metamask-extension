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
  stxAlertIsOpen,
  dismissSTXMigrationAlert,
} from '../../../../ducks/alerts/stx-migration';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';

const STXBannerAlert = () => {
  const dispatch = useDispatch();
  const shouldShow = useSelector(stxAlertIsOpen);
  console.log('=== STX BANNER COMPONENT ===');
  console.log('shouldShow:', shouldShow);
  console.log(
    'Current state:',
    useSelector((state) => state.metamask.alerts?.stxMigration),
  );
  console.log('=== STX BANNER COMPONENT END ===');

  const t = useI18nContext();
  // eslint-disable-next-line no-alert, no-undef
  alert(`STX Banner mounted: shouldShow = ${shouldShow}`); // Temporary debug
  if (!shouldShow) {
    return null;
  }

  return (
    <BannerAlert
      severity={BannerAlertSeverity.Info}
      onClose={() => dispatch(dismissSTXMigrationAlert())}
      data-testid="stx-banner-alert"
    >
      <Text as="p">
        {t('smartTransactionsEnabledMessage')}
        <ButtonLink
          href={ZENDESK_URLS.SMART_TRANSACTIONS_LEARN_MORE}
          onClick={() => dispatch(dismissSTXMigrationAlert())}
          externalLink
        >
          {t('smartTransactionsLearnMore')}
        </ButtonLink>
      </Text>
    </BannerAlert>
  );
};

export default STXBannerAlert;
