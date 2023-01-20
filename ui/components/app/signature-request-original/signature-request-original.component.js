import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { ObjectInspector } from 'react-inspector';
import LedgerInstructionField from '../ledger-instruction-field';

import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import { getURLHostName } from '../../../helpers/utils/util';
import { stripHexPrefix } from '../../../../shared/modules/hexstring-utils';
import Button from '../../ui/button';
import SiteOrigin from '../../ui/site-origin';
import NetworkAccountBalanceHeader from '../network-account-balance-header';
import Typography from '../../ui/typography/typography';
import {
  TYPOGRAPHY,
  FONT_WEIGHT,
  COLORS,
  TEXT_ALIGN,
} from '../../../helpers/constants/design-system';
import { NETWORK_TYPES } from '../../../../shared/constants/network';
import { Numeric } from '../../../../shared/modules/Numeric';
import { EtherDenomination } from '../../../../shared/constants/common';
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
    messagesCount: PropTypes.number,
    showRejectTransactionsConfirmationModal: PropTypes.func.isRequired,
    cancelAll: PropTypes.func.isRequired,
    provider: PropTypes.object,
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
        <div className="request-signature__origin">
          <SiteOrigin
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
          variant={TYPOGRAPHY.H3}
          fontWeight={FONT_WEIGHT.BOLD}
        >
          {this.context.t('sigRequest')}
        </Typography>
        <Typography
          className="request-signature__content__subtitle"
          variant={TYPOGRAPHY.H7}
          color={COLORS.TEXT_ALTERNATIVE}
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
                <div className="request-signature__row-title">{`${name}:`}</div>
                <div className="request-signature__row-value">{value}</div>
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
      <div className="request-signature__footer">
        <Button
          type="secondary"
          large
          className="request-signature__footer__cancel-button"
          onClick={async (event) => {
            await cancel(event);
            clearConfirmTransaction();
            history.push(mostRecentOverviewPage);
          }}
        >
          {t('reject')}
        </Button>
        <Button
          data-testid="request-signature__sign"
          type="primary"
          large
          className="request-signature__footer__sign-button"
          disabled={hardwareWalletRequiresConnection}
          onClick={async (event) => {
            if (type === MESSAGE_TYPE.ETH_SIGN) {
              this.setState({ showSignatureRequestWarning: true });
            } else {
              await sign(event);
              clearConfirmTransaction();
              history.push(mostRecentOverviewPage);
            }
          }}
        >
          {t('sign')}
        </Button>
      </div>
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
      fromAccount: { address, balance, name },
    } = this.props;
    const { showSignatureRequestWarning } = this.state;
    const { t } = this.context;

    const rejectNText = t('rejectRequestsN', [messagesCount]);
    const currentNetwork = this.getNetworkName();

    const balanceInBaseAsset = new Numeric(balance, 16, EtherDenomination.WEI)
      .toDenomination(EtherDenomination.ETH)
      .toBase(10)
      .round(6)
      .toString();

    return (
      <div className="request-signature__container">
        <div className="request-signature__account">
          <NetworkAccountBalanceHeader
            networkName={currentNetwork}
            accountName={name}
            accountBalance={balanceInBaseAsset}
            tokenName={nativeCurrency}
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
