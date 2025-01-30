import React, { useContext, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { memoize } from 'lodash';
import { providerErrors, serializeError } from '@metamask/rpc-errors';
import {
  resolvePendingApproval,
  completedTx,
  rejectPendingApproval,
} from '../../../../store/actions';
import {
  doesAddressRequireLedgerHidConnection,
  getSubjectMetadata,
  getTotalUnapprovedMessagesCount,
  selectNetworkConfigurationByChainId,
} from '../../../../selectors';
import { isAddressLedger } from '../../../../ducks/metamask/metamask';
import { sanitizeMessage } from '../../../../helpers/utils/util';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useRejectTransactionModal } from '../../hooks/useRejectTransactionModal';
import { ConfirmPageContainerNavigation } from '../confirm-page-container';
import SignatureRequestHeader from '../signature-request-header/signature-request-header';
import SecurityProviderBannerMessage from '../security-provider-banner-message';
import LedgerInstructionField from '../ledger-instruction-field';
import ContractDetailsModal from '../contract-details-modal';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { MetaMetricsEventCategory } from '../../../../../shared/constants/metametrics';
import {
  BlockaidResultType,
  SECURITY_PROVIDER_MESSAGE_SEVERITY,
} from '../../../../../shared/constants/security-provider';
import {
  TextAlign,
  TextColor,
  TextVariant,
  Size,
} from '../../../../helpers/constants/design-system';
import {
  ButtonVariant,
  Button,
  ButtonLink,
  TagUrl,
  Text,
} from '../../../../components/component-library';

import BlockaidBannerAlert from '../security-provider-banner-alert/blockaid-banner-alert/blockaid-banner-alert';
import InsightWarnings from '../../../../components/app/snaps/insight-warnings';
import { NetworkChangeToastLegacy } from '../confirm/network-change-toast';
import { QueuedRequestsBannerAlert } from '../../confirmation/components/queued-requests-banner-alert';
import Message from './signature-request-message';
import Footer from './signature-request-footer';

const SignatureRequest = ({ txData, warnings }) => {
  const trackEvent = useContext(MetaMetricsContext);
  const dispatch = useDispatch();
  const t = useI18nContext();

  const [hasScrolledMessage, setHasScrolledMessage] = useState(false);
  const [showContractDetails, setShowContractDetails] = useState(false);
  const [messageRootRef, setMessageRootRef] = useState(null);
  const [messageIsScrollable, setMessageIsScrollable] = useState(false);

  const {
    id,
    type,
    chainId,
    msgParams: { from, data, origin, version },
  } = txData;

  // not forwarded to component
  const hardwareWalletRequiresConnection = useSelector((state) =>
    doesAddressRequireLedgerHidConnection(state, from),
  );

  const { blockExplorerUrls } = useSelector((state) =>
    selectNetworkConfigurationByChainId(state, chainId),
  );

  const blockExplorerUrl = blockExplorerUrls?.[0];
  const unapprovedMessagesCount = useSelector(getTotalUnapprovedMessagesCount);
  const subjectMetadata = useSelector(getSubjectMetadata);
  const isLedgerWallet = useSelector((state) => isAddressLedger(state, from));
  const { handleCancelAll } = useRejectTransactionModal();

  const [isShowingSigInsightWarnings, setIsShowingSigInsightWarnings] =
    useState(false);

  useEffect(() => {
    setMessageIsScrollable(
      messageRootRef?.scrollHeight > messageRootRef?.clientHeight,
    );
  }, [messageRootRef]);

  const targetSubjectMetadata = subjectMetadata?.[origin] || null;

  const parseMessage = memoize((dataToParse) => {
    const {
      message,
      domain = {},
      primaryType,
      types,
    } = JSON.parse(dataToParse);
    const sanitizedMessage = sanitizeMessage(message, primaryType, types);
    return { sanitizedMessage, domain, primaryType };
  });

  const submitButtonType =
    txData.securityAlertResponse?.result_type === BlockaidResultType.Malicious
      ? 'danger-primary'
      : 'primary';

  const onSign = async () => {
    await dispatch(resolvePendingApproval(id));
    completedTx(id);

    trackEvent({
      category: MetaMetricsEventCategory.Transactions,
      event: 'Confirm',
      properties: {
        action: 'Sign Request',
        legacy_event: true,
        type,
        version,
      },
    });
  };

  const onCancel = async () => {
    await dispatch(
      rejectPendingApproval(
        id,
        serializeError(providerErrors.userRejectedRequest()),
      ),
    );
    trackEvent({
      category: MetaMetricsEventCategory.Transactions,
      event: 'Cancel',
      properties: {
        action: 'Sign Request',
        legacy_event: true,
        type,
        version,
      },
    });
  };

  const {
    sanitizedMessage,
    domain: { verifyingContract },
    primaryType,
  } = parseMessage(data);

  return (
    <>
      <div className="signature-request">
        <ConfirmPageContainerNavigation />
        <div
          className="request-signature__account"
          data-testid="request-signature-account"
        >
          <SignatureRequestHeader txData={txData} />
        </div>
        <div className="signature-request-content">
          <BlockaidBannerAlert
            txData={txData}
            marginLeft={4}
            marginRight={4}
            marginBottom={4}
          />
          <QueuedRequestsBannerAlert />
          {(txData?.securityProviderResponse?.flagAsDangerous !== undefined &&
            txData?.securityProviderResponse?.flagAsDangerous !==
              SECURITY_PROVIDER_MESSAGE_SEVERITY.NOT_MALICIOUS) ||
          (txData?.securityProviderResponse &&
            Object.keys(txData.securityProviderResponse).length === 0) ? (
            <SecurityProviderBannerMessage
              securityProviderResponse={txData.securityProviderResponse}
            />
          ) : null}
          <div className="signature-request__origin">
            <TagUrl
              label={origin}
              labelProps={{
                color: TextColor.textAlternative,
              }}
              src={targetSubjectMetadata?.iconUrl}
            />
          </div>
          <Text
            className="signature-request__content__title"
            variant={TextVariant.headingLg}
            marginTop={4}
          >
            {t('sigRequest')}
          </Text>
          <Text
            className="request-signature__content__subtitle"
            variant={TextVariant.bodySm}
            color={TextColor.textAlternative}
            textAlign={TextAlign.Center}
            marginLeft={12}
            marginRight={12}
            marginTop={4}
            as="h6"
          >
            {t('signatureRequestGuidance')}
          </Text>
          {verifyingContract ? (
            <div>
              <Button
                variant={ButtonVariant.Link}
                onClick={() => setShowContractDetails(true)}
                className="signature-request-content__verify-contract-details"
                data-testid="verify-contract-details"
              >
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.primaryDefault}
                  as="h6"
                >
                  {t('verifyContractDetails')}
                </Text>
              </Button>
            </div>
          ) : null}
        </div>
        {isLedgerWallet ? (
          <div className="confirm-approve-content__ledger-instruction-wrapper">
            <LedgerInstructionField showDataInstruction />
          </div>
        ) : null}
        <Message
          data={sanitizedMessage}
          onMessageScrolled={() => setHasScrolledMessage(true)}
          setMessageRootRef={setMessageRootRef}
          messageRootRef={messageRootRef}
          messageIsScrollable={messageIsScrollable}
          primaryType={primaryType}
          chainId={chainId}
        />
        <Footer
          cancelAction={onCancel}
          signAction={() => {
            if (warnings?.length >= 1) {
              return setIsShowingSigInsightWarnings(true);
            }

            return onSign();
          }}
          disabled={
            hardwareWalletRequiresConnection ||
            (messageIsScrollable && !hasScrolledMessage)
          }
          submitButtonType={submitButtonType}
        />
        {showContractDetails && (
          <ContractDetailsModal
            toAddress={verifyingContract}
            chainId={chainId}
            blockExplorerUrl={blockExplorerUrl}
            onClose={() => setShowContractDetails(false)}
            isContractRequestingSignature
          />
        )}
        {unapprovedMessagesCount > 1 ? (
          <ButtonLink
            size={Size.inherit}
            className="signature-request__reject-all-button"
            data-testid="signature-request-reject-all"
            onClick={handleCancelAll}
          >
            {t('rejectRequestsN', [unapprovedMessagesCount])}
          </ButtonLink>
        ) : null}
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
};

SignatureRequest.propTypes = {
  txData: PropTypes.object,
  warnings: PropTypes.array,
};

export default SignatureRequest;
