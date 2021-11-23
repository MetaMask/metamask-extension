import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { INSUFFICIENT_FUNDS_ERROR_KEY } from '../../../helpers/constants/error-keys';
import { submittedPendingTransactionsSelector } from '../../../selectors/transactions';
import { useGasFeeContext } from '../../../contexts/gasFee';
import { useI18nContext } from '../../../hooks/useI18nContext';
import ActionableMessage from '../../../components/ui/actionable-message/actionable-message';
import ErrorMessage from '../../../components/ui/error-message';
import I18nValue from '../../../components/ui/i18n-value';

const TransactionAlerts = ({
  userAcknowledgedGasMissing,
  setUserAcknowledgedGasMissing,
}) => {
  const { balanceError, estimateUsed, hasSimulationError } = useGasFeeContext();
  const pendingTransactions = useSelector(submittedPendingTransactionsSelector);
  const t = useI18nContext();

  return (
    <div className="transaction-alerts">
      {hasSimulationError && (
        <ActionableMessage
          message={<I18nValue messageKey="simulationErrorMessageV2" />}
          useIcon
          iconFillColor="#d73a49"
          type="danger"
          primaryActionV2={
            userAcknowledgedGasMissing
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
            <div className="transaction-alerts__pending-transactions">
              <strong>
                <I18nValue
                  messageKey="pendingTransaction"
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
            </div>
          }
          useIcon
          iconFillColor="#f8c000"
          type="warning"
        />
      )}
      {balanceError && <ErrorMessage errorKey={INSUFFICIENT_FUNDS_ERROR_KEY} />}
      {estimateUsed === 'low' && (
        <ActionableMessage
          message={<I18nValue messageKey="lowPriorityMessage" />}
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
