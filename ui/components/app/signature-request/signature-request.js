import React, { useContext, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import { memoize } from 'lodash';

import {
  accountsWithSendEtherInfoSelector,
  conversionRateSelector,
  doesAddressRequireLedgerHidConnection,
  getCurrentCurrency,
  getPreferences,
  getSelectedAccount,
  getSubjectMetadata,
  getTotalUnapprovedMessagesCount,
  unconfirmedMessagesHashSelector,
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
  valuesFor,
  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  shortenAddress,
  ///: END:ONLY_INCLUDE_IN
} from '../../../helpers/utils/util';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import { ConfirmPageContainerNavigation } from '../confirm-page-container';
import NetworkAccountBalanceHeader from '../network-account-balance-header';
import SecurityProviderBannerMessage from '../security-provider-banner-message';
import LedgerInstructionField from '../ledger-instruction-field';
import ContractDetailsModal from '../modals/contract-details-modal';
import { clearConfirmTransaction } from '../../../ducks/confirm-transaction/confirm-transaction.duck';
import { cancelMsgs, showModal } from '../../../store/actions';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util';
import { getValueFromWeiHex } from '../../../../shared/modules/conversion.utils';
import { Numeric } from '../../../../shared/modules/Numeric';
import { EtherDenomination } from '../../../../shared/constants/common';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import { SECURITY_PROVIDER_MESSAGE_SEVERITIES } from '../security-provider-banner-message/security-provider-banner-message.constants';
import { NETWORK_TYPES } from '../../../../shared/constants/network';
import { useI18nContext } from '../../../hooks/useI18nContext';

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

const SignatureRequest = ({
  txData,
  signPersonalMessage,
  signTypedMessage,
  cancelPersonalMessage,
  cancelTypedMessage,
  signMessage,
  cancelMessage,
}) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);
  const t = useI18nContext();

  const [hasScrolledMessage, setHasScrolledMessage] = useState(false);
  const [showContractDetails, setShowContractDetails] = useState(false);
  const [messageRootRef, setMessageRootRef] = useState(null);
  const {
    type,
    msgParams: { from, data, origin, version },
  } = txData;

  const {
    chainId,
    type: providerName,
    rpcPrefs,
    nickname: providerNickName,
  } = useSelector(getProviderConfig);
  const currentCurrency = useSelector(getCurrentCurrency);
  const nativeCurrency = useSelector(getNativeCurrency);
  const hardwareWalletRequiresConnection = useSelector((state) =>
    doesAddressRequireLedgerHidConnection(state, from),
  );
  const isLedgerWallet = useSelector((state) => isAddressLedger(state, from));
  const unconfirmedMessagesList = useSelector(unconfirmedMessagesHashSelector);
  const unapprovedMessagesCount = useSelector(getTotalUnapprovedMessagesCount);
  const { useNativeCurrencyAsPrimaryCurrency } = useSelector(getPreferences);
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);
  const conversionRateSelected = useSelector(conversionRateSelector);
  const conversionRate = useNativeCurrencyAsPrimaryCurrency
    ? null
    : conversionRateSelected;
  const subjectMetadata = useSelector(getSubjectMetadata);
  // not forwarded to component
  const allAccounts = useSelector(accountsWithSendEtherInfoSelector);
  const { address, balance, name } =
    getAccountByAddress(allAccounts, from) || {};

  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  // Used to show a warning if the signing account is not the selected account
  // Largely relevant for contract wallet custodians
  const selectedAccount = useSelector(getSelectedAccount);
  ///: END:ONLY_INCLUDE_IN

  let cancel;
  let sign;

  if (type === MESSAGE_TYPE.PERSONAL_SIGN) {
    cancel = cancelPersonalMessage;
    sign = signPersonalMessage;
  } else if (type === MESSAGE_TYPE.ETH_SIGN_TYPED_DATA) {
    cancel = cancelTypedMessage;
    sign = signTypedMessage;
  } else if (type === MESSAGE_TYPE.ETH_SIGN) {
    cancel = cancelMessage;
    sign = signMessage;
  }

  const memoizedParseMessage = memoize(() => {
    const { message, domain = {}, primaryType, types } = JSON.parse(data);
    const sanitizedMessage = sanitizeMessage(message, primaryType, types);
    return { sanitizedMessage, domain, primaryType };
  });

  const getNetworkName = (providerType, nickName) => {
    switch (providerType) {
      case NETWORK_TYPES.MAINNET:
        return t('mainnet');
      case NETWORK_TYPES.GOERLI:
        return t('goerli');
      case NETWORK_TYPES.SEPOLIA:
        return t('sepolia');
      case NETWORK_TYPES.LINEA_TESTNET:
        return t('lineatestnet');
      case NETWORK_TYPES.LOCALHOST:
        return t('localhost');
      default:
        return nickName || t('unknownNetwork');
    }
  };

  const handleCancelAll = () => {
    dispatch(
      showModal({
        name: 'REJECT_TRANSACTIONS',
        onSubmit: async () => {
          await dispatch(cancelMsgs(valuesFor(unconfirmedMessagesList)));
          dispatch(clearConfirmTransaction());
          history.push(mostRecentOverviewPage);
        },
        unapprovedTxCount: unapprovedMessagesCount,
        isRequestType: true,
      }),
    );
  };

  const {
    sanitizedMessage,
    domain: { verifyingContract },
    primaryType,
  } = memoizedParseMessage();
  const rejectNText = t('rejectRequestsN', [unapprovedMessagesCount]);
  const currentNetwork = getNetworkName(providerName, providerNickName);

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

  const messageIsScrollable =
    messageRootRef?.scrollHeight > messageRootRef?.clientHeight;

  const targetSubjectMetadata = txData.msgParams.origin
    ? subjectMetadata?.[txData.msgParams.origin]
    : null;

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
                as="h7"
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
          variant={TextVariant.bodySmBold}
          boxProps={{
            marginTop: 4,
          }}
          as="h3"
        >
          {t('sigRequest')}
        </Text>
        <Text
          className="request-signature__content__subtitle"
          variant={TextVariant.bodyXs}
          color={TextColor.textAlternative}
          textAlign={TextAlign.Center}
          margin={12}
          marginTop={3}
          as="h7"
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
                variant={TextVariant.bodyXs}
                color={TextColor.primaryDefault}
                as="h7"
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
          onClick={(e) => {
            e.preventDefault();
            handleCancelAll();
          }}
        >
          {rejectNText}
        </Button>
      ) : null}
    </div>
  );
};

SignatureRequest.propTypes = {
  txData: PropTypes.object,
  signPersonalMessage: PropTypes.func,
  signTypedMessage: PropTypes.func,
  cancelPersonalMessage: PropTypes.func,
  cancelTypedMessage: PropTypes.func,
  signMessage: PropTypes.func,
  cancelMessage: PropTypes.func,
};

export default SignatureRequest;
