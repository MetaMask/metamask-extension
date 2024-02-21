import React, { useContext, useState, useEffect } from 'react';
import {
  useDispatch,
  useSelector,
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  shallowEqual,
  ///: END:ONLY_INCLUDE_IF
} from 'react-redux';
import PropTypes from 'prop-types';
import { memoize } from 'lodash';
import { ethErrors, serializeError } from 'eth-rpc-errors';
import {
  resolvePendingApproval,
  completedTx,
  rejectPendingApproval,
} from '../../../../store/actions';
import {
  doesAddressRequireLedgerHidConnection,
  getSubjectMetadata,
  getTotalUnapprovedMessagesCount,
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  accountsWithSendEtherInfoSelector,
  getSelectedAccount,
  getAccountType,
  ///: END:ONLY_INCLUDE_IF
} from '../../../../selectors';
import {
  getProviderConfig,
  isAddressLedger,
} from '../../../../ducks/metamask/metamask';
import {
  sanitizeMessage,
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  getAccountByAddress,
  shortenAddress,
  ///: END:ONLY_INCLUDE_IF
} from '../../../../helpers/utils/util';
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
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  IconColor,
  BackgroundColor,
  Display,
  BlockSize,
  ///: END:ONLY_INCLUDE_IF
} from '../../../../helpers/constants/design-system';
import {
  ButtonVariant,
  Button,
  ButtonLink,
  TagUrl,
  Text,
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  Icon,
  IconName,
  Box,
  ///: END:ONLY_INCLUDE_IF
} from '../../../../components/component-library';

///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import { useMMICustodySignMessage } from '../../../../hooks/useMMICustodySignMessage';
///: END:ONLY_INCLUDE_IF
///: BEGIN:ONLY_INCLUDE_IF(blockaid)
import BlockaidBannerAlert from '../security-provider-banner-alert/blockaid-banner-alert/blockaid-banner-alert';
///: END:ONLY_INCLUDE_IF

///: BEGIN:ONLY_INCLUDE_IF(build-flask)
import InsightWarnings from '../../../../components/app/snaps/insight-warnings';
///: END:ONLY_INCLUDE_IF
import Message from './signature-request-message';
import Footer from './signature-request-footer';

const SignatureRequest = ({
  txData,
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  warnings,
  ///: END:ONLY_INCLUDE_IF
}) => {
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
    msgParams: { from, data, origin, version },
  } = txData;

  // not forwarded to component
  const hardwareWalletRequiresConnection = useSelector((state) =>
    doesAddressRequireLedgerHidConnection(state, from),
  );
  const { chainId, rpcPrefs } = useSelector(getProviderConfig);
  const unapprovedMessagesCount = useSelector(getTotalUnapprovedMessagesCount);
  const subjectMetadata = useSelector(getSubjectMetadata);
  const isLedgerWallet = useSelector((state) => isAddressLedger(state, from));
  const { handleCancelAll } = useRejectTransactionModal();

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  // Used to show a warning if the signing account is not the selected account
  // Largely relevant for contract wallet custodians
  const selectedAccount = useSelector(getSelectedAccount);
  const accountType = useSelector(getAccountType);
  const allAccounts = useSelector(
    accountsWithSendEtherInfoSelector,
    shallowEqual,
  );
  const { address } = getAccountByAddress(allAccounts, from) || {};
  const { custodySignFn } = useMMICustodySignMessage();
  ///: END:ONLY_INCLUDE_IF

  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  const [isShowingSigInsightWarnings, setIsShowingSigInsightWarnings] =
    useState(false);
  ///: END:ONLY_INCLUDE_IF

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
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    if (accountType === 'custody') {
      await custodySignFn(txData);
    }
    ///: END:ONLY_INCLUDE_IF

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
        serializeError(ethErrors.provider.userRejectedRequest()),
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
          {
            ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
            <BlockaidBannerAlert
              txData={txData}
              marginLeft={4}
              marginRight={4}
              marginBottom={4}
            />
            ///: END:ONLY_INCLUDE_IF
          }
          {(txData?.securityProviderResponse?.flagAsDangerous !== undefined &&
            txData?.securityProviderResponse?.flagAsDangerous !==
              SECURITY_PROVIDER_MESSAGE_SEVERITY.NOT_MALICIOUS) ||
          (txData?.securityProviderResponse &&
            Object.keys(txData.securityProviderResponse).length === 0) ? (
            <SecurityProviderBannerMessage
              securityProviderResponse={txData.securityProviderResponse}
            />
          ) : null}
          {
            ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
            selectedAccount.address === address ? null : (
              <Box
                className="request-signature__mismatch-info"
                display={Display.Flex}
                width={BlockSize.Full}
                padding={4}
                marginBottom={4}
                backgroundColor={BackgroundColor.primaryMuted}
              >
                <Icon
                  name={IconName.Info}
                  color={IconColor.infoDefault}
                  marginRight={2}
                />
                <Text
                  variant={TextVariant.bodyXs}
                  color={TextColor.textDefault}
                  as="h6"
                >
                  {t('mismatchAccount', [
                    shortenAddress(selectedAccount.address),
                    shortenAddress(address),
                  ])}
                </Text>
              </Box>
            )
            ///: END:ONLY_INCLUDE_IF
          }
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
        />
        <Footer
          cancelAction={onCancel}
          signAction={() => {
            ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
            if (warnings?.length >= 1) {
              return setIsShowingSigInsightWarnings(true);
            }
            ///: END:ONLY_INCLUDE_IF
            return onSign();
          }}
          disabled={
            ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
            Boolean(txData?.custodyId) ||
            ///: END:ONLY_INCLUDE_IF
            hardwareWalletRequiresConnection ||
            (messageIsScrollable && !hasScrolledMessage)
          }
          submitButtonType={submitButtonType}
        />
        {showContractDetails && (
          <ContractDetailsModal
            toAddress={verifyingContract}
            chainId={chainId}
            rpcPrefs={rpcPrefs}
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
      {
        ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
      }
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
      {
        ///: END:ONLY_INCLUDE_IF
      }
    </>
  );
};

SignatureRequest.propTypes = {
  txData: PropTypes.object,
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  warnings: PropTypes.array,
  ///: END:ONLY_INCLUDE_IF
};

export default SignatureRequest;
