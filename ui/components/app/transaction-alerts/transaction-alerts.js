import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { PriorityLevels } from '../../../../shared/constants/gas';
import { submittedPendingTransactionsSelector } from '../../../selectors';
import { useGasFeeContext } from '../../../contexts/gasFee';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { BannerAlert } from '../../component-library';
import SimulationErrorMessage from '../../ui/simulation-error-message';
import Typography from '../../ui/typography';
import {
  TypographyVariant,
  SEVERITIES,
} from '../../../helpers/constants/design-system';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';

const TransactionAlerts = ({
  userAcknowledgedGasMissing,
  setUserAcknowledgedGasMissing,
}) => {
  const { estimateUsed, hasSimulationError, supportsEIP1559, isNetworkBusy } =
    useGasFeeContext();
  const pendingTransactions = useSelector(submittedPendingTransactionsSelector);
  const t = useI18nContext();

  return (
    <div className="transaction-alerts">
      {supportsEIP1559 && hasSimulationError && (
        <SimulationErrorMessage
          userAcknowledgedGasMissing={userAcknowledgedGasMissing}
          setUserAcknowledgedGasMissing={setUserAcknowledgedGasMissing}
        />
      )}
      {supportsEIP1559 && pendingTransactions?.length > 0 && (
        <BannerAlert severity={SEVERITIES.WARNING}>
          <Typography
            align="left"
            className="transaction-alerts__pending-transactions"
            margin={0}
            tag={TypographyVariant.paragraph}
            variant={TypographyVariant.H7}
          >
            <strong>
              {pendingTransactions?.length === 1
                ? t('pendingTransactionSingle', [pendingTransactions?.length])
                : t('pendingTransactionMultiple', [
                    pendingTransactions?.length,
                  ])}
            </strong>{' '}
            {t('pendingTransactionInfo')}
            {t('learnCancelSpeeedup', [
              <a
                key="cancelSpeedUpInfo"
                href={ZENDESK_URLS.SPEEDUP_CANCEL}
                rel="noopener noreferrer"
                target="_blank"
              >
                {t('cancelSpeedUp')}
              </a>,
            ])}
          </Typography>
        </BannerAlert>
      )}
      {estimateUsed === PriorityLevels.low && (
        <BannerAlert
          data-testid="low-gas-fee-alert"
          severity={SEVERITIES.WARNING}
        >
          {t('lowPriorityMessage')}
        </BannerAlert>
      )}
      {supportsEIP1559 && isNetworkBusy ? (
        <BannerAlert severity={SEVERITIES.WARNING}>
          {t('networkIsBusy')}
        </BannerAlert>
      ) : null}
    </div>
  );
};

TransactionAlerts.propTypes = {
  userAcknowledgedGasMissing: PropTypes.bool,
  setUserAcknowledgedGasMissing: PropTypes.func,
};

export default TransactionAlerts;
