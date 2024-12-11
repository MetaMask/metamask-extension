import * as React from 'react';
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

type MarginType = 'default' | 'none' | 'noTop' | 'onlyTop';

interface SmartTransactionsBannerAlertProps {
  marginType?: MarginType;
}

export const SmartTransactionsBannerAlert: React.FC<SmartTransactionsBannerAlertProps> =
  React.memo(({ marginType = 'default' }) => {
    const dispatch = useDispatch();
    const shouldShow = useSelector(shouldShowSmartTransactionsMigrationAlert);
    const t = useI18nContext();

    if (!shouldShow) {
      return null;
    }

    const getMarginStyle = () => {
      switch (marginType) {
        case 'none':
          return { margin: 0 };
        case 'noTop':
          return { marginTop: 0 };
        case 'onlyTop':
          return { margin: 0, marginTop: 16 };
        default:
          return undefined;
      }
    };

    return (
      <BannerAlert
        severity={BannerAlertSeverity.Info}
        onClose={() => {
          console.log('Dismiss clicked');
          dispatch(dismissAndDisableAlert());
        }}
        data-testid="smart-transactions-banner-alert"
        style={getMarginStyle()}
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
  });

SmartTransactionsBannerAlert.displayName = 'SmartTransactionsBannerAlert';

export default SmartTransactionsBannerAlert;
