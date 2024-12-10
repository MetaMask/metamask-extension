import * as React from 'react';
import PropTypes from 'prop-types';
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

/**
 * @typedef {'default' | 'none' | 'noTop' | 'onlyTop'} MarginType
 * @param {object} props
 * @param {MarginType} [props.marginType='default']
 */
const SmartTransactionsBannerAlert = React.memo(
  ({ marginType = 'default' }) => {
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
          return { margin: 0, marginTop: 16 }; // or whatever the default top margin value should be
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
  },
);

SmartTransactionsBannerAlert.propTypes = {
  marginType: PropTypes.oneOf(['default', 'none', 'noTop', 'onlyTop']),
};

SmartTransactionsBannerAlert.displayName = 'SmartTransactionsBannerAlert';

export { SmartTransactionsBannerAlert };
