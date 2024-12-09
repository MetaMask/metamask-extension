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
  dismissAndDisableAlert,
} from '../../../../ducks/alerts/stx-migration';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';

const STXBannerAlert = () => {
  const dispatch = useDispatch();
  const shouldShow = useSelector(stxAlertIsOpen);
  // const fullState = useSelector((state) => state);
  // console.log(fullState)

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
      data-testid="stx-banner-alert"
    >
      <Text as="p">
        {t('smartTransactionsEnabled')}
        <ButtonLink
          href={ZENDESK_URLS.SMART_TRANSACTIONS_LEARN_MORE}
          onClick={() => dispatch(dismissAndDisableAlert())}
          externalLink
        >
          {t('learnMore')}
        </ButtonLink>
      </Text>
    </BannerAlert>
  );
};

export default STXBannerAlert;
