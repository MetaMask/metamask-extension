import React, { FC } from 'react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  BannerAlert,
  ButtonLink,
  Text,
  BannerAlertSeverity,
} from '../../../../components/component-library';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';

interface STXBannerAlertProps {
  onClose: () => void;
}

const STXBannerAlert: FC<STXBannerAlertProps> = ({ onClose }) => {
  const t = useI18nContext();

  return (
    <BannerAlert
      severity={BannerAlertSeverity.Info}
      onClose={onClose}
      data-testid="stx-banner-alert"
    >
      <Text as="p">
        {t('smartTransactionsEnabledMessage')}
        <ButtonLink
          href={ZENDESK_URLS.SMART_TRANSACTIONS_LEARN_MORE}
          onClick={onClose}
          externalLink
        >
          {t('smartTransactionsLearnMore')}
        </ButtonLink>
      </Text>
    </BannerAlert>
  );
};

export default STXBannerAlert;
