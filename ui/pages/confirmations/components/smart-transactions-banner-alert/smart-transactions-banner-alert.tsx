import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  BannerAlert,
  ButtonLink,
  Box,
  Text,
  BannerAlertSeverity,
} from '../../../../components/component-library';
import { setAlertEnabledness } from '../../../../store/actions';
import { AlertTypes } from '../../../../../shared/constants/alerts';
import { SMART_TRANSACTIONS_LEARN_MORE_URL } from '../../../../../shared/constants/smartTransactions';
import { FontWeight } from '../../../../helpers/constants/design-system';
import { useConfirmContext } from '../../context/confirm';
import { isCorrectDeveloperTransactionType } from '../../../../../shared/lib/confirmation.utils';
import {
  getSmartTransactionsOptInStatusInternal,
  getSmartTransactionsMigrationAppliedInternal,
} from '../../../../../shared/modules/selectors/smart-transactions';
import {
  getChainSupportsSmartTransactions,
  getSmartTransactionsPreferenceEnabled,
} from '../../../../../shared/modules/selectors';

type MarginType = 'default' | 'none' | 'noTop' | 'onlyTop';

type SmartTransactionsBannerAlertProps = {
  marginType?: MarginType;
};

export const SmartTransactionsBannerAlert: React.FC<SmartTransactionsBannerAlertProps> =
  React.memo(({ marginType = 'default' }) => {
    const t = useI18nContext();

    let currentConfirmation;
    try {
      const context = useConfirmContext();
      currentConfirmation = context?.currentConfirmation;
    } catch {
      currentConfirmation = null;
    }

    const alertEnabled = useSelector(
      (state: {
        metamask: { alertEnabledness?: { [key: string]: boolean } };
      }) =>
        state.metamask.alertEnabledness?.[
          AlertTypes.smartTransactionsMigration
        ] !== false,
    );

    const smartTransactionsOptIn = useSelector(
      getSmartTransactionsOptInStatusInternal,
    );

    const smartTransactionsMigrationApplied = useSelector(
      getSmartTransactionsMigrationAppliedInternal,
    );

    const chainSupportsSmartTransactions = useSelector(
      getChainSupportsSmartTransactions,
    );

    const smartTransactionsPreferenceEnabled = useSelector(
      getSmartTransactionsPreferenceEnabled,
    );

    const dismissAlert = useCallback(() => {
      setAlertEnabledness(AlertTypes.smartTransactionsMigration, false);
    }, []);

    React.useEffect(() => {
      if (alertEnabled && !smartTransactionsOptIn) {
        dismissAlert();
      }
    }, [alertEnabled, smartTransactionsOptIn, dismissAlert]);

    const alertConditions =
      alertEnabled &&
      smartTransactionsOptIn &&
      smartTransactionsMigrationApplied &&
      chainSupportsSmartTransactions &&
      smartTransactionsPreferenceEnabled;

    const shouldRender =
      currentConfirmation === null
        ? alertConditions
        : alertConditions &&
          isCorrectDeveloperTransactionType(
            currentConfirmation?.type as TransactionType,
          );

    if (!shouldRender) {
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
      <Box className="transaction-alerts">
        <BannerAlert
          severity={BannerAlertSeverity.Info}
          onClose={dismissAlert}
          data-testid="smart-transactions-banner-alert"
          style={getMarginStyle()}
        >
          <Text fontWeight={FontWeight.Bold}>
            {t('smartTransactionsEnabledTitle')}
          </Text>
          <Text as="p">
            <ButtonLink
              href={SMART_TRANSACTIONS_LEARN_MORE_URL}
              onClick={dismissAlert}
              externalLink
              style={{ height: 'unset', verticalAlign: 'unset' }}
            >
              {t('smartTransactionsEnabledLink')}
            </ButtonLink>
            {t('smartTransactionsEnabledDescription')}
          </Text>
        </BannerAlert>
      </Box>
    );
  });

SmartTransactionsBannerAlert.displayName = 'SmartTransactionsBannerAlert';

export default SmartTransactionsBannerAlert;
