import React, { useCallback, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import log from 'loglevel';
import { isValidSIWEOrigin } from '@metamask/controller-utils';
import { providerErrors, serializeError } from '@metamask/rpc-errors';
import { BannerAlert, Text } from '../../../../components/component-library';
import Popover from '../../../../components/ui/popover';
import Checkbox from '../../../../components/ui/check-box';
import Button from '../../../../components/ui/button';
import { I18nContext } from '../../../../contexts/i18n';
import { PageContainerFooter } from '../../../../components/ui/page-container';
import { isAddressLedger } from '../../../../ducks/metamask/metamask';
import {
  accountsWithSendEtherInfoSelector,
  getSubjectMetadata,
  getTotalUnapprovedMessagesCount,
  unconfirmedMessagesHashSelector,
} from '../../../../selectors';
import { valuesFor, getAccountByAddress } from '../../../../helpers/utils/util';
import { isSuspiciousResponse } from '../../../../../shared/modules/security-provider.utils';
import { formatMessageParams } from '../../../../../shared/modules/siwe';
import { clearConfirmTransaction } from '../../../../ducks/confirm-transaction/confirm-transaction.duck';

import {
  SEVERITIES,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  resolvePendingApproval,
  rejectPendingApproval,
  rejectAllMessages,
  completedTx,
  showModal,
} from '../../../../store/actions';

import SecurityProviderBannerMessage from '../security-provider-banner-message/security-provider-banner-message';
import ConfirmPageContainerNavigation from '../confirm-page-container/confirm-page-container-navigation';
import { getMostRecentOverviewPage } from '../../../../ducks/history/history';
import BlockaidBannerAlert from '../security-provider-banner-alert/blockaid-banner-alert/blockaid-banner-alert';
import LedgerInstructionField from '../ledger-instruction-field';

import SignatureRequestHeader from '../signature-request-header';
import InsightWarnings from '../../../../components/app/snaps/insight-warnings';
import { BlockaidResultType } from '../../../../../shared/constants/security-provider';
import { NetworkChangeToastLegacy } from '../confirm/network-change-toast';
import Header from './signature-request-siwe-header';
import Message from './signature-request-siwe-message';

export default function SignatureRequestSIWE({ txData, warnings }) {
  const dispatch = useDispatch();
  const history = useHistory();
  const t = useContext(I18nContext);
  const allAccounts = useSelector(accountsWithSendEtherInfoSelector);
  const subjectMetadata = useSelector(getSubjectMetadata);
  const messagesCount = useSelector(getTotalUnapprovedMessagesCount);
  const messagesList = useSelector(unconfirmedMessagesHashSelector);
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);

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

  const [isShowingSigInsightWarnings, setIsShowingSigInsightWarnings] =
    useState(false);

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
          serializeError(providerErrors.userRejectedRequest()),
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

  const submitButtonType =
    txData.securityAlertResponse?.result_type ===
      BlockaidResultType.Malicious || !isSIWEDomainValid
      ? 'danger-primary'
      : 'primary';

  return (
    <>
      <div className="signature-request-siwe">
        <div className="request-signature__navigation">
          <ConfirmPageContainerNavigation />
        </div>
        <SignatureRequestHeader txData={txData} />
        <BlockaidBannerAlert
          txData={txData}
          marginTop={4}
          marginLeft={4}
          marginRight={4}
        />
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
          onSubmit={() => {
            if (warnings?.length >= 1) {
              return isSIWEDomainValid
                ? setIsShowingSigInsightWarnings(true)
                : setIsShowingDomainWarning(true);
            }

            if (isSIWEDomainValid) {
              return onSign();
            }

            return setIsShowingDomainWarning(true);
          }}
          cancelText={t('cancel')}
          submitText={t('signin')}
          submitButtonType={submitButtonType}
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
                onSubmit={() => {
                  if (warnings?.length >= 1) {
                    return setIsShowingSigInsightWarnings(true);
                  }

                  onSign();
                  return setIsShowingDomainWarning(false);
                }}
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
                onClick={() =>
                  setHasAgreedToDomainWarning((checked) => !checked)
                }
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
      {isShowingSigInsightWarnings && (
        <InsightWarnings
          warnings={warnings}
          action="signing"
          origin={origin}
          onCancel={() => setIsShowingSigInsightWarnings(false)}
          onSubmit={() => {
            onSign();
            setIsShowingSigInsightWarnings(false);
          }}
        />
      )}
      <NetworkChangeToastLegacy confirmation={txData} />
    </>
  );
}

SignatureRequestSIWE.propTypes = {
  /**
   * The display content of transaction data
   */
  txData: PropTypes.object.isRequired,

  /**
   * Signature insights array
   */
  warnings: PropTypes.array,
};
