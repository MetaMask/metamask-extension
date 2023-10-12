import React, {
  ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
  useCallback,
  useContext,
  ///: END:ONLY_INCLUDE_IN
} from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { PriorityLevels } from '../../../../shared/constants/gas';
import { submittedPendingTransactionsSelector } from '../../../selectors';
import { useGasFeeContext } from '../../../contexts/gasFee';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { BannerAlert, ButtonLink, Text } from '../../component-library';
import SimulationErrorMessage from '../../ui/simulation-error-message';
import { SEVERITIES } from '../../../helpers/constants/design-system';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
///: BEGIN:ONLY_INCLUDE_IN(blockaid)
import { MetaMetricsContext } from '../../../contexts/metametrics';
///: END:ONLY_INCLUDE_IN

import { isSuspiciousResponse } from '../../../../shared/modules/security-provider.utils';
///: BEGIN:ONLY_INCLUDE_IN(blockaid)
import BlockaidBannerAlert from '../security-provider-banner-alert/blockaid-banner-alert/blockaid-banner-alert';
///: END:ONLY_INCLUDE_IN
import SecurityProviderBannerMessage from '../security-provider-banner-message/security-provider-banner-message';
import { getNativeCurrency } from '../../../ducks/metamask/metamask';
import { TransactionType } from '../../../../shared/constants/transaction';
import { parseStandardTokenTransactionData } from '../../../../shared/modules/transaction.utils';
import { getTokenValueParam } from '../../../../shared/lib/metamask-controller-utils';
import {
  ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  ///: END:ONLY_INCLUDE_IN
} from '../../../../shared/constants/metametrics';

const TransactionAlerts = ({
  userAcknowledgedGasMissing,
  setUserAcknowledgedGasMissing,
  tokenSymbol,
  txData,
}) => {
  const { estimateUsed, hasSimulationError, supportsEIP1559, isNetworkBusy } =
    useGasFeeContext();
  const pendingTransactions = useSelector(submittedPendingTransactionsSelector);
  const t = useI18nContext();
  const nativeCurrency = useSelector(getNativeCurrency);
  const transactionData = txData.txParams.data;
  const currentTokenSymbol = tokenSymbol || nativeCurrency;
  let currentTokenAmount;

  if (txData.type === TransactionType.simpleSend) {
    currentTokenAmount = txData.txParams.value;
  }
  if (txData.type === TransactionType.tokenMethodTransfer) {
    const tokenData = parseStandardTokenTransactionData(transactionData);
    currentTokenAmount = getTokenValueParam(tokenData);
  }

  // isSendingZero is true when either sending native tokens where the value is in txParams
  // or sending tokens where the value is in the txData
  // We want to only display this warning in the cases where txType is simpleSend || transfer and not contractInteractions
  const hasProperTxType =
    txData.type === TransactionType.simpleSend ||
    txData.type === TransactionType.tokenMethodTransfer;

  const isSendingZero =
    hasProperTxType &&
    (currentTokenAmount === '0x0' || currentTokenAmount === '0');

  ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
  const trackEvent = useContext(MetaMetricsContext);
  ///: END:ONLY_INCLUDE_IN

  ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
  const onClickSupportLink = useCallback(() => {
    trackEvent({
      category: MetaMetricsEventCategory.Transactions,
      event: MetaMetricsEventName.ExternalLinkClicked,
      properties: {
        action: 'Confirm Screen',
        origin: txData?.origin,
        external_link_clicked: 'security_alert_support_link',
      },
    });
  }, []);
  ///: END:ONLY_INCLUDE_IN

  return (
    <div className="transaction-alerts">
      {
        ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
        <BlockaidBannerAlert
          onClickSupportLink={onClickSupportLink}
          securityAlertResponse={txData?.securityAlertResponse}
        />
        ///: END:ONLY_INCLUDE_IN
      }
      {isSuspiciousResponse(txData?.securityProviderResponse) && (
        <SecurityProviderBannerMessage
          securityProviderResponse={txData.securityProviderResponse}
        />
      )}

      {supportsEIP1559 && hasSimulationError && (
        <SimulationErrorMessage
          userAcknowledgedGasMissing={userAcknowledgedGasMissing}
          setUserAcknowledgedGasMissing={setUserAcknowledgedGasMissing}
        />
      )}
      {supportsEIP1559 && pendingTransactions?.length > 0 && (
        <BannerAlert severity={SEVERITIES.WARNING}>
          <Text as="p">
            <strong>
              {pendingTransactions?.length === 1
                ? t('pendingTransactionSingle', [pendingTransactions?.length])
                : t('pendingTransactionMultiple', [
                    pendingTransactions?.length,
                  ])}
            </strong>{' '}
            {t('pendingTransactionInfo')}
            {t('learnCancelSpeeedup', [
              <ButtonLink
                key="cancelSpeedUpInfo"
                href={ZENDESK_URLS.SPEEDUP_CANCEL}
                rel="noopener noreferrer"
                target="_blank"
              >
                {t('cancelSpeedUp')}
              </ButtonLink>,
            ])}
          </Text>
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
      {isSendingZero && (
        <BannerAlert severity={SEVERITIES.WARNING}>
          {t('sendingZeroAmount', [currentTokenSymbol])}
        </BannerAlert>
      )}
    </div>
  );
};

TransactionAlerts.propTypes = {
  userAcknowledgedGasMissing: PropTypes.bool,
  setUserAcknowledgedGasMissing: PropTypes.func,
  tokenSymbol: PropTypes.string,
  txData: PropTypes.object,
};

export default TransactionAlerts;
