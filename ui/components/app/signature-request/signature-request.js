import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
import { showCustodianDeepLink } from '@metamask-institutional/extension';
///: END:ONLY_INCLUDE_IN
import {
  accountsWithSendEtherInfoSelector,
  conversionRateSelector,
  doesAddressRequireLedgerHidConnection,
  getCurrentCurrency,
  getPreferences,
  getSubjectMetadata,
  getTotalUnapprovedMessagesCount,
  unconfirmedMessagesHashSelector,
  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  getSelectedAccount,
  ///: END:ONLY_INCLUDE_IN
} from '../../../selectors';
import {
  getNativeCurrency,
  getProviderConfig,
  isAddressLedger,
} from '../../../ducks/metamask/metamask';
import {
  getAccountByAddress,
  getURLHostName,
  sanitizeMessage,
  getNetworkNameFromProviderType,
  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  shortenAddress,
  ///: END:ONLY_INCLUDE_IN
} from '../../../helpers/utils/util';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useRejectTransactionModalHooks } from '../../../hooks/useRejectTransactionModalHooks';

import { ConfirmPageContainerNavigation } from '../confirm-page-container';
import NetworkAccountBalanceHeader from '../network-account-balance-header';
import SecurityProviderBannerMessage from '../security-provider-banner-message';
import LedgerInstructionField from '../ledger-instruction-field';
import ContractDetailsModal from '../modals/contract-details-modal';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util';
import { getValueFromWeiHex } from '../../../../shared/modules/conversion.utils';
import { Numeric } from '../../../../shared/modules/Numeric';
import { EtherDenomination } from '../../../../shared/constants/common';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { SECURITY_PROVIDER_MESSAGE_SEVERITIES } from '../security-provider-banner-message/security-provider-banner-message.constants';
///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
// eslint-disable-next-line import/order
import { mmiActionsFactory } from '../../../store/institutional/institution-background';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../../../shared/constants/app';
///: END:ONLY_INCLUDE_IN

import {
  TextAlign,
  TextColor,
  TextVariant,
  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  IconColor,
  DISPLAY,
  BLOCK_SIZES,
  BackgroundColor,
  ///: END:ONLY_INCLUDE_IN
} from '../../../helpers/constants/design-system';
import {
  BUTTON_VARIANT,
  Button,
  TagUrl,
  Text,
  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  Icon,
  IconName,
  ///: END:ONLY_INCLUDE_IN
} from '../../component-library';
import Box from '../../ui/box/box';

import Message from './signature-request-message';
import Footer from './signature-request-footer';

const SignatureRequest = ({ txData, sign, cancel }) => {
  const trackEvent = useContext(MetaMetricsContext);
  const dispatch = useDispatch();
  const t = useI18nContext();

  const [hasScrolledMessage, setHasScrolledMessage] = useState(false);
  const [showContractDetails, setShowContractDetails] = useState(false);
  const [messageRootRef, setMessageRootRef] = useState(null);

  const {
    type,
    msgParams: { from, data, origin, version },
  } = txData;

  // not forwarded to component
  const allAccounts = useSelector(accountsWithSendEtherInfoSelector);
  const { address, balance, name } =
    getAccountByAddress(allAccounts, from) || {};

  const conversionRateSelected = useSelector(conversionRateSelector);
  const hardwareWalletRequiresConnection = useSelector((state) =>
    doesAddressRequireLedgerHidConnection(state, from),
  );
  const currentCurrency = useSelector(getCurrentCurrency);
  const nativeCurrency = useSelector(getNativeCurrency);
  const { useNativeCurrencyAsPrimaryCurrency } = useSelector(getPreferences);
  const conversionRate = useNativeCurrencyAsPrimaryCurrency
    ? null
    : conversionRateSelected;

  const {
    chainId,
    type: providerName,
    rpcPrefs,
    nickname: providerNickName,
  } = useSelector(getProviderConfig);
  const unapprovedMessagesCount = useSelector(getTotalUnapprovedMessagesCount);
  const subjectMetadata = useSelector(getSubjectMetadata);
  const isLedgerWallet = useSelector((state) => isAddressLedger(state, from));
  const unconfirmedMessagesList = useSelector(unconfirmedMessagesHashSelector);
  const useRejectTransactionHooks = useRejectTransactionModalHooks(
    unconfirmedMessagesList,
    unapprovedMessagesCount,
  );

  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  // Used to show a warning if the signing account is not the selected account
  // Largely relevant for contract wallet custodians
  const selectedAccount = useSelector(getSelectedAccount);
  const mmiActions = mmiActionsFactory();
  const isNotification = getEnvironmentType() === ENVIRONMENT_TYPE_NOTIFICATION;
  ///: END:ONLY_INCLUDE_IN

  const messageIsScrollable =
    messageRootRef?.scrollHeight > messageRootRef?.clientHeight;

  const targetSubjectMetadata = txData.msgParams.origin
    ? subjectMetadata?.[txData.msgParams.origin]
    : null;

  const parseMessage = () => {
    const { message, domain = {}, primaryType, types } = JSON.parse(data);
    const sanitizedMessage = sanitizeMessage(message, primaryType, types);
    return { sanitizedMessage, domain, primaryType };
  };

  const balanceInBaseAsset = conversionRate
    ? formatCurrency(
        getValueFromWeiHex({
          value: balance,
          fromCurrency: nativeCurrency,
          toCurrency: currentCurrency,
          conversionRate,
          numberOfDecimals: 6,
          toDenomination: EtherDenomination.ETH,
        }),
        currentCurrency,
      )
    : new Numeric(balance, 16, EtherDenomination.WEI)
        .toDenomination(EtherDenomination.ETH)
        .round(6)
        .toBase(10)
        .toString();

  const onSign = (event) => {
    sign(event);
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

  const onCancel = (event) => {
    cancel(event);
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
  } = parseMessage();

  const rejectNText = t('rejectRequestsN', [unapprovedMessagesCount]);

  const networkName = getNetworkNameFromProviderType(providerName);
  const currentNetwork =
    networkName === ''
      ? providerNickName || t('unknownNetwork')
      : t(networkName);

  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  useEffect(() => {
    if (txData.custodyId) {
      dispatch(
        showCustodianDeepLink({
          dispatch,
          mmiActions,
          txId: undefined,
          custodyId: txData.custodyId,
          fromAddress: address,
          isSignature: true,
          closeNotification: isNotification,
          onDeepLinkFetched: () => undefined,
          onDeepLinkShown: () => {
            trackEvent({
              category: 'MMI',
              event: 'Show deeplink for signature',
            });
          },
        }),
      );
    }
  }, []);
  ///: END:ONLY_INCLUDE_IN

  return (
    <div className="signature-request">
      <ConfirmPageContainerNavigation />
      <div
        className="request-signature__account"
        data-testid="request-signature-account"
      >
        <NetworkAccountBalanceHeader
          networkName={currentNetwork}
          accountName={name}
          accountBalance={balanceInBaseAsset}
          tokenName={
            conversionRate ? currentCurrency?.toUpperCase() : nativeCurrency
          }
          accountAddress={address}
        />
      </div>
      <div className="signature-request-content">
        {(txData?.securityProviderResponse?.flagAsDangerous !== undefined &&
          txData?.securityProviderResponse?.flagAsDangerous !==
            SECURITY_PROVIDER_MESSAGE_SEVERITIES.NOT_MALICIOUS) ||
        (txData?.securityProviderResponse &&
          Object.keys(txData.securityProviderResponse).length === 0) ? (
          <SecurityProviderBannerMessage
            securityProviderResponse={txData.securityProviderResponse}
          />
        ) : null}
        {
          ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
          selectedAccount.address === address ? null : (
            <Box
              className="request-signature__mismatch-info"
              display={DISPLAY.FLEX}
              width={BLOCK_SIZES.FULL}
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
          ///: END:ONLY_INCLUDE_IN
        }
        <div className="signature-request__origin">
          <TagUrl
            label={getURLHostName(origin) || origin}
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
              variant={BUTTON_VARIANT.LINK}
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
        signAction={onSign}
        disabled={
          ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
          Boolean(txData?.custodyId) ||
          ///: END:ONLY_INCLUDE_IN
          hardwareWalletRequiresConnection ||
          (messageIsScrollable && !hasScrolledMessage)
        }
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
        <Button
          type="link"
          className="signature-request__reject-all-button"
          data-testid="signature-request-reject-all"
          onClick={useRejectTransactionHooks()}
        >
          {rejectNText}
        </Button>
      ) : null}
    </div>
  );
};

SignatureRequest.propTypes = {
  txData: PropTypes.object,
  sign: PropTypes.func,
  cancel: PropTypes.func,
};

export default SignatureRequest;
