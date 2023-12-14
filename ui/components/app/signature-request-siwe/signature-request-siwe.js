import React, {
  useCallback,
  useContext,
  ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
  useEffect,
  ///: END:ONLY_INCLUDE_IF
  useState,
} from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import log from 'loglevel';
import { isValidSIWEOrigin } from '@metamask/controller-utils';
import { ethErrors, serializeError } from 'eth-rpc-errors';
import { BannerAlert, Text } from '../../component-library';
import Popover from '../../ui/popover';
import Checkbox from '../../ui/check-box';
import Button from '../../ui/button';
import { I18nContext } from '../../../contexts/i18n';
import { PageContainerFooter } from '../../ui/page-container';
import { isAddressLedger } from '../../../ducks/metamask/metamask';
import {
  accountsWithSendEtherInfoSelector,
  getSubjectMetadata,
  getTotalUnapprovedMessagesCount,
  unconfirmedMessagesHashSelector,
} from '../../../selectors';
import { getAccountByAddress, valuesFor } from '../../../helpers/utils/util';
import { isSuspiciousResponse } from '../../../../shared/modules/security-provider.utils';
import { formatMessageParams } from '../../../../shared/modules/siwe';
import { clearConfirmTransaction } from '../../../ducks/confirm-transaction/confirm-transaction.duck';

import {
  SEVERITIES,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  resolvePendingApproval,
  rejectPendingApproval,
  rejectAllMessages,
  completedTx,
  showModal,
} from '../../../store/actions';

import SecurityProviderBannerMessage from '../security-provider-banner-message/security-provider-banner-message';
import ConfirmPageContainerNavigation from '../confirm-page-container/confirm-page-container-navigation';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
///: BEGIN:ONLY_INCLUDE_IF(blockaid)
import BlockaidBannerAlert from '../security-provider-banner-alert/blockaid-banner-alert/blockaid-banner-alert';
import { getBlockaidMetricsParams } from '../../../helpers/utils/metrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
///: END:ONLY_INCLUDE_IF
import LedgerInstructionField from '../ledger-instruction-field';

import SignatureRequestHeader from '../signature-request-header';
import Header from './signature-request-siwe-header';
import Message from './signature-request-siwe-message';

export default function SignatureRequestSIWE({ txData }) {
  const dispatch = useDispatch();
  const history = useHistory();
  const t = useContext(I18nContext);
  const allAccounts = useSelector(accountsWithSendEtherInfoSelector);
  const subjectMetadata = useSelector(getSubjectMetadata);
  const messagesCount = useSelector(getTotalUnapprovedMessagesCount);
  const messagesList = useSelector(unconfirmedMessagesHashSelector);
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);
  ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
  const trackEvent = useContext(MetaMetricsContext);
  ///: END:ONLY_INCLUDE_IF

  ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
  useEffect(() => {
    if (txData.securityAlertResponse) {
      const blockaidMetricsParams = getBlockaidMetricsParams(
        txData.securityAlertResponse,
      );

      trackEvent({
        category: MetaMetricsEventCategory.Transactions,
        event: MetaMetricsEventName.SignatureRequested,
        properties: {
          action: 'Sign Request',
          ...blockaidMetricsParams,
        },
      });
    }
  }, []);
  ///: END:ONLY_INCLUDE_IF

  const {
    msgParams: {
      from,
      origin,
      siwe: { parsedMessage },
    },
    id,
  } = txData;

  const isLedgerWallet = useSelector((state) => isAddressLedger(state, from));

  const fromAccount = getAccountByAddress(allAccounts, from);
  const targetSubjectMetadata = subjectMetadata[origin];

  const isMatchingAddress =
    from.toLowerCase() === parsedMessage.address.toLowerCase();

  const isSIWEDomainValid = isValidSIWEOrigin(txData.msgParams);

  const [isShowingDomainWarning, setIsShowingDomainWarning] = useState(false);
  const [hasAgreedToDomainWarning, setHasAgreedToDomainWarning] =
    useState(false);

  const showSecurityProviderBanner = isSuspiciousResponse(
    txData?.securityProviderResponse,
  );

  const onSign = useCallback(async () => {
    try {
      await dispatch(resolvePendingApproval(id, null));
      dispatch(completedTx(id));
    } catch (e) {
      log.error(e);
    }
  }, [id, dispatch]);

  const onCancel = useCallback(async () => {
    try {
      await dispatch(
        rejectPendingApproval(
          id,
          serializeError(ethErrors.provider.userRejectedRequest()),
        ),
      );
    } catch (e) {
      log.error(e);
    }
  }, [dispatch, id]);

  const handleCancelAll = () => {
    const unapprovedTxCount = messagesCount;

    dispatch(
      showModal({
        name: 'REJECT_TRANSACTIONS',
        unapprovedTxCount,
        onSubmit: async () => {
          await dispatch(rejectAllMessages(valuesFor(messagesList)));
          dispatch(clearConfirmTransaction());
          history.push(mostRecentOverviewPage);
        },
      }),
    );
  };

  const rejectNText = t('rejectRequestsN', [messagesCount]);

  return (
    <div className="signature-request-siwe">
      <div className="request-signature__navigation">
        <ConfirmPageContainerNavigation />
      </div>
      <SignatureRequestHeader txData={txData} />

      {
        ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
        <BlockaidBannerAlert
          securityAlertResponse={txData?.securityAlertResponse}
          margin={4}
        />
        ///: END:ONLY_INCLUDE_IF
      }
      {showSecurityProviderBanner && (
        <SecurityProviderBannerMessage
          securityProviderResponse={txData.securityProviderResponse}
        />
      )}

      <Header
        fromAccount={fromAccount}
        domain={origin}
        isSIWEDomainValid={isSIWEDomainValid}
        subjectMetadata={targetSubjectMetadata}
      />
      <Message data={formatMessageParams(parsedMessage, t)} />
      {!isMatchingAddress && (
        <BannerAlert
          severity={SEVERITIES.WARNING}
          marginLeft={4}
          marginRight={4}
          marginBottom={4}
        >
          {t('SIWEAddressInvalid', [
            parsedMessage.address,
            fromAccount.address,
          ])}
        </BannerAlert>
      )}
      {isLedgerWallet && (
        <div className="confirm-approve-content__ledger-instruction-wrapper">
          <LedgerInstructionField showDataInstruction />
        </div>
      )}
      {!isSIWEDomainValid && (
        <BannerAlert
          severity={SEVERITIES.DANGER}
          marginLeft={4}
          marginRight={4}
          marginBottom={4}
        >
          <Text variant={TextVariant.bodyMdBold}>
            {t('SIWEDomainInvalidTitle')}
          </Text>{' '}
          <Text>{t('SIWEDomainInvalidText')}</Text>
        </BannerAlert>
      )}
      <PageContainerFooter
        footerClassName="signature-request-siwe__page-container-footer"
        onCancel={onCancel}
        onSubmit={
          isSIWEDomainValid ? onSign : () => setIsShowingDomainWarning(true)
        }
        cancelText={t('cancel')}
        submitText={t('signin')}
        submitButtonType={isSIWEDomainValid ? 'primary' : 'danger-primary'}
      />
      {messagesCount > 1 ? (
        <Button
          type="link"
          className="request-signature__container__reject"
          onClick={(e) => {
            e.preventDefault();
            handleCancelAll();
          }}
        >
          {rejectNText}
        </Button>
      ) : null}
      {isShowingDomainWarning && (
        <Popover
          onClose={() => setIsShowingDomainWarning(false)}
          title={t('SIWEWarningTitle')}
          subtitle={t('SIWEWarningSubtitle')}
          className="signature-request-siwe__warning-popover"
          footerClassName="signature-request-siwe__warning-popover__footer"
          footer={
            <PageContainerFooter
              footerClassName="signature-request-siwe__warning-popover__footer__warning-footer"
              onCancel={() => setIsShowingDomainWarning(false)}
              cancelText={t('cancel')}
              cancelButtonType="default"
              onSubmit={onSign}
              submitText={t('confirm')}
              submitButtonType="danger-primary"
              disabled={!hasAgreedToDomainWarning}
            />
          }
        >
          <div className="signature-request-siwe__warning-popover__checkbox-wrapper">
            <Checkbox
              id="signature-request-siwe_domain-checkbox"
              checked={hasAgreedToDomainWarning}
              className="signature-request-siwe__warning-popover__checkbox-wrapper__checkbox"
              onClick={() => setHasAgreedToDomainWarning((checked) => !checked)}
            />
            <label
              className="signature-request-siwe__warning-popover__checkbox-wrapper__label"
              htmlFor="signature-request-siwe_domain-checkbox"
            >
              {t('SIWEDomainWarningBody', [parsedMessage.domain])}
            </label>
          </div>
        </Popover>
      )}
    </div>
  );
}

SignatureRequestSIWE.propTypes = {
  /**
   * The display content of transaction data
   */
  txData: PropTypes.object.isRequired,
};
