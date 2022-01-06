import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { PRIORITY_LEVELS } from '../../../../shared/constants/gas';
import { INSUFFICIENT_FUNDS_ERROR_KEY } from '../../../helpers/constants/error-keys';
import { submittedPendingTransactionsSelector } from '../../../selectors/transactions';
import { useGasFeeContext } from '../../../contexts/gasFee';
import { useI18nContext } from '../../../hooks/useI18nContext';
import ActionableMessage from '../../../components/ui/actionable-message/actionable-message';
import ErrorMessage from '../../../components/ui/error-message';
import I18nValue from '../../../components/ui/i18n-value';
import Typography from '../../../components/ui/typography';
import { TYPOGRAPHY } from '../../../helpers/constants/design-system';

const TransactionAlerts = ({
  userAcknowledgedGasMissing,
  setUserAcknowledgedGasMissing,
}) => {
  const {
    balanceError,
    estimateUsed,
    hasSimulationError,
    supportsEIP1559V2,
  } = useGasFeeContext();
  const pendingTransactions = useSelector(submittedPendingTransactionsSelector);
  const t = useI18nContext();

  if (!supportsEIP1559V2) {
    return null;
  }

  return (
    <div className="transaction-alerts">
      {hasSimulationError && (
        <ActionableMessage
          message={<I18nValue messageKey="simulationErrorMessageV2" />}
          useIcon
          iconFillColor="#d73a49"
          type="danger"
          primaryActionV2={
            userAcknowledgedGasMissing === true
              ? undefined
              : {
                  label: t('proceedWithTransaction'),
                  onClick: setUserAcknowledgedGasMissing,
                }
          }
        />
      )}
      {pendingTransactions?.length > 0 && (
        <ActionableMessage
          message={
            <Typography
              align="left"
              className="transaction-alerts__pending-transactions"
              margin={[0, 0]}
              tag={TYPOGRAPHY.Paragraph}
              variant={TYPOGRAPHY.H7}
            >
              <strong>
                <I18nValue
                  messageKey={
                    pendingTransactions?.length === 1
                      ? 'pendingTransactionSingle'
                      : 'pendingTransactionMultiple'
                  }
                  options={[pendingTransactions?.length]}
                />
              </strong>{' '}
              <I18nValue messageKey="pendingTransactionInfo" />{' '}
              <I18nValue
                messageKey="learnCancelSpeeedup"
                options={[
                  <a
                    key="cancelSpeedUpInfo"
                    href="https://metamask.zendesk.com/hc/en-us/articles/360015489251-How-to-speed-up-or-cancel-a-pending-transaction"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <I18nValue messageKey="cancelSpeedUp" />
                  </a>,
                ]}
              />
            </Typography>
          }
          useIcon
          iconFillColor="#f8c000"
          type="warning"
        />
      )}
      {balanceError && <ErrorMessage errorKey={INSUFFICIENT_FUNDS_ERROR_KEY} />}
      {estimateUsed === PRIORITY_LEVELS.LOW && (
        <ActionableMessage
          message={
            <Typography
              align="left"
              margin={[0, 0]}
              tag={TYPOGRAPHY.Paragraph}
              variant={TYPOGRAPHY.H7}
            >
              <I18nValue messageKey="lowPriorityMessage" />
            </Typography>
          }
          useIcon
          iconFillColor="#f8c000"
          type="warning"
        />
      )}
    </div>
  );
};

TransactionAlerts.propTypes = {
  userAcknowledgedGasMissing: PropTypes.bool,
  setUserAcknowledgedGasMissing: PropTypes.func,
};

export default TransactionAlerts;
