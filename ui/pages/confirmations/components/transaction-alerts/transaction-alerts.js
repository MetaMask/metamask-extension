import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';
import { PriorityLevels } from '../../../../../shared/constants/gas';
import { useGasFeeContext } from '../../../../contexts/gasFee';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  BannerAlert,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  ButtonLink,
  Text,
  ///: END:ONLY_INCLUDE_IF
} from '../../../../components/component-library';
import SimulationErrorMessage from '../simulation-error-message';
import { SEVERITIES } from '../../../../helpers/constants/design-system';
// eslint-disable-next-line import/no-duplicates
import { selectNetworkConfigurationByChainId } from '../../../../selectors';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
// eslint-disable-next-line import/no-duplicates
import { submittedPendingTransactionsSelector } from '../../../../selectors';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';
///: END:ONLY_INCLUDE_IF

import { isSuspiciousResponse } from '../../../../../shared/modules/security-provider.utils';
import BlockaidBannerAlert from '../security-provider-banner-alert/blockaid-banner-alert/blockaid-banner-alert';
import SecurityProviderBannerMessage from '../security-provider-banner-message/security-provider-banner-message';
import { parseStandardTokenTransactionData } from '../../../../../shared/modules/transaction.utils';
import { getTokenValueParam } from '../../../../../shared/lib/metamask-controller-utils';
import { QueuedRequestsBannerAlert } from '../../confirmation/components/queued-requests-banner-alert';

const TransactionAlerts = ({
  userAcknowledgedGasMissing,
  setUserAcknowledgedGasMissing,
  tokenSymbol,
  txData,
  isUsingPaymaster,
}) => {
  const {
    estimateUsed,
    hasSimulationError,
    ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
    supportsEIP1559,
    ///: END:ONLY_INCLUDE_IF
  } = useGasFeeContext();

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const pendingTransactions = useSelector(submittedPendingTransactionsSelector);
  ///: END:ONLY_INCLUDE_IF

  const t = useI18nContext();
  const { chainId } = txData;

  const { nativeCurrency } = useSelector((state) =>
    selectNetworkConfigurationByChainId(state, chainId),
  );

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

  return (
    <div className="transaction-alerts">
      <BlockaidBannerAlert txData={txData} />
      {isSuspiciousResponse(txData?.securityProviderResponse) && (
        <SecurityProviderBannerMessage
          securityProviderResponse={txData.securityProviderResponse}
        />
      )}

      <QueuedRequestsBannerAlert />

      {hasSimulationError && (
        <SimulationErrorMessage
          userAcknowledgedGasMissing={userAcknowledgedGasMissing}
          setUserAcknowledgedGasMissing={setUserAcknowledgedGasMissing}
        />
      )}

      {
        ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
        supportsEIP1559 && pendingTransactions?.length > 0 && (
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
        )
        ///: END:ONLY_INCLUDE_IF
      }

      {estimateUsed === PriorityLevels.low && (
        <BannerAlert
          data-testid="low-gas-fee-alert"
          severity={SEVERITIES.WARNING}
        >
          {t('lowPriorityMessage')}
        </BannerAlert>
      )}
      {isSendingZero && (
        <BannerAlert severity={SEVERITIES.WARNING}>
          {t('sendingZeroAmount', [currentTokenSymbol])}
        </BannerAlert>
      )}
      {isUsingPaymaster && (
        <BannerAlert data-testid="paymaster-alert" severity={SEVERITIES.INFO}>
          {t('paymasterInUse')}
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
  isUsingPaymaster: PropTypes.bool,
};

export default TransactionAlerts;
