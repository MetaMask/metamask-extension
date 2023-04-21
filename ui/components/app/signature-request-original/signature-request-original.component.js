import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { ObjectInspector } from 'react-inspector';
import LedgerInstructionField from '../ledger-instruction-field';

import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import {
  getURLHostName,
  sanitizeString,
  ///: BEGIN:ONLY_INCLUDE_IN(mmi)
  shortenAddress,
  ///: END:ONLY_INCLUDE_IN
} from '../../../helpers/utils/util';
import { stripHexPrefix } from '../../../../shared/modules/hexstring-utils';
import Button from '../../ui/button';
import SiteOrigin from '../../ui/site-origin';
import NetworkAccountBalanceHeader from '../network-account-balance-header';
import Typography from '../../ui/typography/typography';
import { PageContainerFooter } from '../../ui/page-container';
import {
  TypographyVariant,
  FONT_WEIGHT,
  TEXT_ALIGN,
  TextColor,
  ///: BEGIN:ONLY_INCLUDE_IN(mmi)
  IconColor,
  DISPLAY,
  BLOCK_SIZES,
  TextVariant,
  BackgroundColor,
  ///: END:ONLY_INCLUDE_IN
} from '../../../helpers/constants/design-system';
import { NETWORK_TYPES } from '../../../../shared/constants/network';
import { Numeric } from '../../../../shared/modules/Numeric';
import { EtherDenomination } from '../../../../shared/constants/common';
import ConfirmPageContainerNavigation from '../confirm-page-container/confirm-page-container-navigation';
import SecurityProviderBannerMessage from '../security-provider-banner-message/security-provider-banner-message';
import { SECURITY_PROVIDER_MESSAGE_SEVERITIES } from '../security-provider-banner-message/security-provider-banner-message.constants';
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util';
import { getValueFromWeiHex } from '../../../../shared/modules/conversion.utils';

///: BEGIN:ONLY_INCLUDE_IN(mmi)
import { Icon, IconName, Text } from '../../component-library';
import Box from '../../ui/box/box';
///: END:ONLY_INCLUDE_IN
import SignatureRequestOriginalWarning from './signature-request-original-warning';

export default class SignatureRequestOriginal extends Component {
  static contextTypes = {
    t: PropTypes.func.isRequired,
  };

  static propTypes = {
    fromAccount: PropTypes.shape({
      address: PropTypes.string.isRequired,
      balance: PropTypes.string,
      name: PropTypes.string,
    }).isRequired,
    cancel: PropTypes.func.isRequired,
    clearConfirmTransaction: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
    mostRecentOverviewPage: PropTypes.string.isRequired,
    sign: PropTypes.func.isRequired,
    txData: PropTypes.object.isRequired,
    subjectMetadata: PropTypes.object,
    hardwareWalletRequiresConnection: PropTypes.bool,
    isLedgerWallet: PropTypes.bool,
    nativeCurrency: PropTypes.string.isRequired,
    currentCurrency: PropTypes.string.isRequired,
    conversionRate: PropTypes.number,
    messagesCount: PropTypes.number,
    showRejectTransactionsConfirmationModal: PropTypes.func.isRequired,
    cancelAll: PropTypes.func.isRequired,
    provider: PropTypes.object,
    ///: BEGIN:ONLY_INCLUDE_IN(mmi)
    selectedAccount: PropTypes.object,
    ///: END:ONLY_INCLUDE_IN
  };

  state = {
    showSignatureRequestWarning: false,
  };

  getNetworkName() {
    const { provider } = this.props;
    const providerName = provider.type;
    const { t } = this.context;

    switch (providerName) {
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
        return provider.nickname || t('unknownNetwork');
    }
  }

  msgHexToText = (hex) => {
    try {
      const stripped = stripHexPrefix(hex);
      const buff = Buffer.from(stripped, 'hex');
      return buff.length === 32 ? hex : buff.toString('utf8');
    } catch (e) {
      return hex;
    }
  };

  renderAccountInfo = () => {
    return (
      <div className="request-signature__account-info">
        {this.renderAccount()}
        {this.renderRequestIcon()}
        {this.renderBalance()}
      </div>
    );
  };

  renderTypedData = (data) => {
    const { t } = this.context;
    const { domain, message } = JSON.parse(data);
    return (
      <div className="request-signature__typed-container">
        {domain ? (
          <div>
            <h1>{t('domain')}</h1>
            <ObjectInspector data={domain} expandLevel={1} name="domain" />
          </div>
        ) : (
          ''
        )}
        {message ? (
          <div>
            <h1>{t('message')}</h1>
            <ObjectInspector data={message} expandLevel={1} name="message" />
          </div>
        ) : (
          ''
        )}
      </div>
    );
  };

  renderBody = () => {
    let rows;
    const notice = `${this.context.t('youSign')}:`;

    const { txData, subjectMetadata } = this.props;
    const {
      type,
      msgParams: { data },
    } = txData;

    if (type === MESSAGE_TYPE.PERSONAL_SIGN) {
      rows = [
        { name: this.context.t('message'), value: this.msgHexToText(data) },
      ];
    } else if (type === MESSAGE_TYPE.ETH_SIGN_TYPED_DATA) {
      rows = data;
    } else if (type === MESSAGE_TYPE.ETH_SIGN) {
      rows = [{ name: this.context.t('message'), value: data }];
    }

    const targetSubjectMetadata = txData.msgParams.origin
      ? subjectMetadata?.[txData.msgParams.origin]
      : null;

    return (
      <div className="request-signature__body">
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
          ///: BEGIN:ONLY_INCLUDE_IN(mmi)
          this.props.selectedAccount.address ===
          this.props.fromAccount.address ? null : (
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
                {this.context.t('mismatchAccount', [
                  shortenAddress(this.props.selectedAccount.address),
                  shortenAddress(this.props.fromAccount.address),
                ])}
              </Text>
            </Box>
          )
          ///: END:ONLY_INCLUDE_IN
        }

        <div className="request-signature__origin">
          <SiteOrigin
            title={txData.msgParams.origin}
            siteOrigin={txData.msgParams.origin}
            iconSrc={targetSubjectMetadata?.iconUrl}
            iconName={
              getURLHostName(targetSubjectMetadata?.origin) ||
              targetSubjectMetadata?.origin
            }
            chip
          />
        </div>

        <Typography
          className="request-signature__content__title"
          variant={TypographyVariant.H3}
          fontWeight={FONT_WEIGHT.BOLD}
        >
          {this.context.t('sigRequest')}
        </Typography>
        <Typography
          className="request-signature__content__subtitle"
          variant={TypographyVariant.H7}
          color={TextColor.textAlternative}
          align={TEXT_ALIGN.CENTER}
          margin={12}
          marginTop={3}
        >
          {this.context.t('signatureRequestGuidance')}
        </Typography>

        <div className={classnames('request-signature__notice')}>{notice}</div>
        <div className="request-signature__rows">
          {rows.map(({ name, value }, index) => {
            if (typeof value === 'boolean') {
              // eslint-disable-next-line no-param-reassign
              value = value.toString();
            }
            return (
              <div
                className="request-signature__row"
                key={`request-signature-row-${index}`}
              >
                <div className="request-signature__row-title">
                  {sanitizeString(`${name}:`)}
                </div>
                <div className="request-signature__row-value">
                  {sanitizeString(value)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  onSubmit = async (event) => {
    const { clearConfirmTransaction, history, mostRecentOverviewPage, sign } =
      this.props;

    await sign(event);
    clearConfirmTransaction();
    history.push(mostRecentOverviewPage);
  };

  onCancel = async (event) => {
    const { clearConfirmTransaction, history, mostRecentOverviewPage, cancel } =
      this.props;

    await cancel(event);
    clearConfirmTransaction();
    history.push(mostRecentOverviewPage);
  };

  renderFooter = () => {
    const {
      cancel,
      sign,
      clearConfirmTransaction,
      history,
      mostRecentOverviewPage,
      txData: { type },
      hardwareWalletRequiresConnection,
    } = this.props;
    const { t } = this.context;

    return (
      <PageContainerFooter
        cancelText={t('reject')}
        submitText={t('sign')}
        onCancel={async (event) => {
          await cancel(event);
          clearConfirmTransaction();
          history.push(mostRecentOverviewPage);
        }}
        onSubmit={async (event) => {
          if (type === MESSAGE_TYPE.ETH_SIGN) {
            this.setState({ showSignatureRequestWarning: true });
          } else {
            await sign(event);
            clearConfirmTransaction();
            history.push(mostRecentOverviewPage);
          }
        }}
        disabled={hardwareWalletRequiresConnection}
      />
    );
  };

  handleCancelAll = () => {
    const {
      cancelAll,
      clearConfirmTransaction,
      history,
      mostRecentOverviewPage,
      showRejectTransactionsConfirmationModal,
      messagesCount,
    } = this.props;
    const unapprovedTxCount = messagesCount;

    showRejectTransactionsConfirmationModal({
      unapprovedTxCount,
      onSubmit: async () => {
        await cancelAll();
        clearConfirmTransaction();
        history.push(mostRecentOverviewPage);
      },
    });
  };

  render = () => {
    const {
      messagesCount,
      nativeCurrency,
      currentCurrency,
      fromAccount: { address, balance, name },
      conversionRate,
    } = this.props;
    const { showSignatureRequestWarning } = this.state;
    const { t } = this.context;

    const rejectNText = t('rejectRequestsN', [messagesCount]);
    const currentNetwork = this.getNetworkName();

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

    return (
      <div className="request-signature__container">
        <div className="request-signature__navigation">
          <ConfirmPageContainerNavigation />
        </div>
        <div className="request-signature__account">
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
        {this.renderBody()}
        {this.props.isLedgerWallet ? (
          <div className="confirm-approve-content__ledger-instruction-wrapper">
            <LedgerInstructionField showDataInstruction />
          </div>
        ) : null}
        {showSignatureRequestWarning && (
          <SignatureRequestOriginalWarning
            senderAddress={address}
            name={name}
            onSubmit={async (event) => await this.onSubmit(event)}
            onCancel={async (event) => await this.onCancel(event)}
          />
        )}
        {this.renderFooter()}
        {messagesCount > 1 ? (
          <Button
            type="link"
            className="request-signature__container__reject"
            onClick={() => this.handleCancelAll()}
          >
            {rejectNText}
          </Button>
        ) : null}
      </div>
    );
  };
}
