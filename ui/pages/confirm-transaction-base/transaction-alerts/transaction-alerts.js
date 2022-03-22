import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { PRIORITY_LEVELS } from '../../../../shared/constants/gas';
import { submittedPendingTransactionsSelector } from '../../../selectors/transactions';
import { useGasFeeContext } from '../../../contexts/gasFee';
import { useI18nContext } from '../../../hooks/useI18nContext';
import ActionableMessage from '../../../components/ui/actionable-message/actionable-message';
import I18nValue from '../../../components/ui/i18n-value';
import Button from '../../../components/ui/button';
import Typography from '../../../components/ui/typography';
import { TYPOGRAPHY } from '../../../helpers/constants/design-system';
import { TRANSACTION_TYPES } from '../../../../shared/constants/transaction';
import { BUYABLE_CHAINS_MAP } from '../../../../shared/constants/network';

const TransactionAlerts = ({
  userAcknowledgedGasMissing,
  setUserAcknowledgedGasMissing,
  chainId,
  nativeCurrency,
  networkName,
  showBuyModal,
  type,
}) => {
  const {
    balanceError,
    estimateUsed,
    hasSimulationError,
    supportsEIP1559V2,
    isNetworkBusy,
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
      {balanceError && type === TRANSACTION_TYPES.DEPLOY_CONTRACT ? (
        <ActionableMessage
          className="actionable-message--warning"
          message={
            <Typography variant={TYPOGRAPHY.H7} align="left">
              {t('insufficientCurrencyBuyOrDeposit', [
                nativeCurrency,
                networkName,
                Object.keys(BUYABLE_CHAINS_MAP).includes(chainId) ? (
                  <>
                    <Button
                      type="inline"
                      className="transaction-alerts__link"
                      onClick={showBuyModal}
                    >
                      {t('buy')}
                      {` ${nativeCurrency} `}
                    </Button>
                    {t('or')}
                  </>
                ) : (
                  ''
                ),
              ])}
            </Typography>
          }
          useIcon
          iconFillColor="#d73a49"
          type="danger"
        />
      ) : null}
      {estimateUsed === PRIORITY_LEVELS.LOW && (
        <ActionableMessage
          dataTestId="low-gas-fee-alert"
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
      {isNetworkBusy ? (
        <ActionableMessage
          message={
            <Typography
              align="left"
              margin={[0, 0]}
              tag={TYPOGRAPHY.Paragraph}
              variant={TYPOGRAPHY.H7}
            >
              <I18nValue messageKey="networkIsBusy" />
            </Typography>
          }
          iconFillColor="#f8c000"
          type="warning"
          useIcon
        />
      ) : null}
    </div>
  );
};

TransactionAlerts.propTypes = {
  userAcknowledgedGasMissing: PropTypes.bool,
  setUserAcknowledgedGasMissing: PropTypes.func,
  chainId: PropTypes.string,
  nativeCurrency: PropTypes.string,
  networkName: PropTypes.string,
  showBuyModal: PropTypes.func,
  type: PropTypes.string,
};

export default TransactionAlerts;
