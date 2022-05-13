import React, { Component } from 'react';
import PropTypes from 'prop-types';
import copyToClipboard from 'copy-to-clipboard';
import classnames from 'classnames';

import AccountListItem from '../../components/app/account-list-item';
import Button from '../../components/ui/button';
import Identicon from '../../components/ui/identicon';
import Tooltip from '../../components/ui/tooltip';
import Copy from '../../components/ui/icon/copy-icon.component';

import { EVENT } from '../../../shared/constants/metametrics';
import { SECOND } from '../../../shared/constants/time';
import { conversionUtil } from '../../../shared/modules/conversion.utils';

export default class ConfirmDecryptMessage extends Component {
  static contextTypes = {
    t: PropTypes.func.isRequired,
    trackEvent: PropTypes.func.isRequired,
  };

  static propTypes = {
    fromAccount: PropTypes.shape({
      address: PropTypes.string.isRequired,
      balance: PropTypes.string,
      name: PropTypes.string,
    }).isRequired,
    clearConfirmTransaction: PropTypes.func.isRequired,
    cancelDecryptMessage: PropTypes.func.isRequired,
    decryptMessage: PropTypes.func.isRequired,
    decryptMessageInline: PropTypes.func.isRequired,
    conversionRate: PropTypes.number,
    history: PropTypes.object.isRequired,
    mostRecentOverviewPage: PropTypes.string.isRequired,
    requesterAddress: PropTypes.string,
    txData: PropTypes.object,
    subjectMetadata: PropTypes.object,
  };

  state = {
    fromAccount: this.props.fromAccount,
    copyToClipboardPressed: false,
    hasCopied: false,
  };

  copyMessage = () => {
    copyToClipboard(this.state.rawMessage);
    this.context.trackEvent({
      category: EVENT.CATEGORIES.MESSAGES,
      event: 'Copy',
      properties: {
        action: 'Decrypt Message Copy',
        legacy_event: true,
      },
    });
    this.setState({ hasCopied: true });
    setTimeout(() => this.setState({ hasCopied: false }), SECOND * 3);
  };

  renderHeader = () => {
    return (
      <div className="request-decrypt-message__header">
        <div className="request-decrypt-message__header-background" />

        <div className="request-decrypt-message__header__text">
          {this.context.t('decryptRequest')}
        </div>

        <div className="request-decrypt-message__header__tip-container">
          <div className="request-decrypt-message__header__tip" />
        </div>
      </div>
    );
  };

  renderAccount = () => {
    const { fromAccount } = this.state;
    const { t } = this.context;

    return (
      <div className="request-decrypt-message__account">
        <div className="request-decrypt-message__account-text">
          {`${t('account')}:`}
        </div>

        <div className="request-decrypt-message__account-item">
          <AccountListItem account={fromAccount} />
        </div>
      </div>
    );
  };

  renderBalance = () => {
    const { conversionRate } = this.props;
    const {
      fromAccount: { balance },
    } = this.state;
    const { t } = this.context;

    const balanceInEther = conversionUtil(balance, {
      fromNumericBase: 'hex',
      toNumericBase: 'dec',
      fromDenomination: 'WEI',
      numberOfDecimals: 6,
      conversionRate,
    });

    return (
      <div className="request-decrypt-message__balance">
        <div className="request-decrypt-message__balance-text">
          {`${t('balance')}:`}
        </div>
        <div className="request-decrypt-message__balance-value">
          {`${balanceInEther} ETH`}
        </div>
      </div>
    );
  };

  renderRequestIcon = () => {
    const { requesterAddress } = this.props;

    return (
      <div className="request-decrypt-message__request-icon">
        <Identicon diameter={40} address={requesterAddress} />
      </div>
    );
  };

  renderAccountInfo = () => {
    return (
      <div className="request-decrypt-message__account-info">
        {this.renderAccount()}
        {this.renderRequestIcon()}
        {this.renderBalance()}
      </div>
    );
  };

  renderBody = () => {
    const { decryptMessageInline, subjectMetadata, txData } = this.props;
    const { t } = this.context;

    const targetSubjectMetadata = subjectMetadata[txData.msgParams.origin];
    const name = targetSubjectMetadata?.name || txData.msgParams.origin;
    const notice = t('decryptMessageNotice', [txData.msgParams.origin]);

    const {
      hasCopied,
      hasDecrypted,
      hasError,
      rawMessage,
      errorMessage,
      copyToClipboardPressed,
    } = this.state;

    return (
      <div className="request-decrypt-message__body">
        {this.renderAccountInfo()}
        <div className="request-decrypt-message__visual">
          <section>
            {targetSubjectMetadata?.iconUrl ? (
              <img
                className="request-decrypt-message__visual-identicon"
                src={targetSubjectMetadata.iconUrl}
                alt=""
              />
            ) : (
              <i className="request-decrypt-message__visual-identicon--default">
                {name.charAt(0).toUpperCase()}
              </i>
            )}
            <div className="request-decrypt-message__notice">{notice}</div>
          </section>
        </div>
        <div className="request-decrypt-message__message">
          <div className="request-decrypt-message__message-text">
            {!hasDecrypted && !hasError ? txData.msgParams.data : rawMessage}
            {hasError ? errorMessage : ''}
          </div>
          <div
            className={classnames('request-decrypt-message__message-cover', {
              'request-decrypt-message__message-lock--pressed':
                hasDecrypted || hasError,
            })}
          />
          <div
            className={classnames('request-decrypt-message__message-lock', {
              'request-decrypt-message__message-lock--pressed':
                hasDecrypted || hasError,
            })}
            onClick={(event) => {
              decryptMessageInline(txData, event).then((result) => {
                if (result.error) {
                  this.setState({
                    hasError: true,
                    errorMessage: this.context.t('decryptInlineError', [
                      result.error,
                    ]),
                  });
                } else {
                  this.setState({
                    hasDecrypted: true,
                    rawMessage: result.rawData,
                  });
                }
              });
            }}
          >
            <div className="request-decrypt-message__message-lock__container">
              <i className="fa fa-lock fa-lg request-decrypt-message__message-lock__container__icon" />
              <div className="request-decrypt-message__message-lock__container__text">
                {t('decryptMetamask')}
              </div>
            </div>
          </div>
        </div>
        {hasDecrypted ? (
          <div
            className={classnames({
              'request-decrypt-message__message-copy': true,
              'request-decrypt-message__message-copy--pressed': copyToClipboardPressed,
            })}
            onClick={() => this.copyMessage()}
            onMouseDown={() => this.setState({ copyToClipboardPressed: true })}
            onMouseUp={() => this.setState({ copyToClipboardPressed: false })}
          >
            <Tooltip
              position="bottom"
              title={hasCopied ? t('copiedExclamation') : t('copyToClipboard')}
              wrapperClassName="request-decrypt-message__message-copy-tooltip"
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <div className="request-decrypt-message__message-copy-text">
                {t('decryptCopy')}
              </div>
              <Copy size={17} color="var(--color-primary-default)" />
            </Tooltip>
          </div>
        ) : (
          <div></div>
        )}
      </div>
    );
  };

  renderFooter = () => {
    const {
      cancelDecryptMessage,
      clearConfirmTransaction,
      decryptMessage,
      history,
      mostRecentOverviewPage,
      txData,
    } = this.props;
    const { trackEvent, t } = this.context;

    return (
      <div className="request-decrypt-message__footer">
        <Button
          type="secondary"
          large
          className="request-decrypt-message__footer__cancel-button"
          onClick={async (event) => {
            await cancelDecryptMessage(txData, event);
            trackEvent({
              category: EVENT.CATEGORIES.MESSAGES,
              event: 'Cancel',
              properties: {
                action: 'Decrypt Message Request',
                legacy_event: true,
              },
            });
            clearConfirmTransaction();
            history.push(mostRecentOverviewPage);
          }}
        >
          {t('cancel')}
        </Button>
        <Button
          type="primary"
          large
          className="request-decrypt-message__footer__sign-button"
          onClick={async (event) => {
            await decryptMessage(txData, event);
            trackEvent({
              category: EVENT.CATEGORIES.MESSAGES,
              event: 'Confirm',
              properties: {
                action: 'Decrypt Message Request',
                legacy_event: true,
              },
            });
            clearConfirmTransaction();
            history.push(mostRecentOverviewPage);
          }}
        >
          {t('decrypt')}
        </Button>
      </div>
    );
  };

  render = () => {
    return (
      <div className="request-decrypt-message__container">
        {this.renderHeader()}
        {this.renderBody()}
        {this.renderFooter()}
      </div>
    );
  };
}
