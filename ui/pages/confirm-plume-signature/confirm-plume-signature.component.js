import React, { Component } from 'react';
import PropTypes from 'prop-types';

import AccountListItem from '../../components/app/account-list-item';
import Identicon from '../../components/ui/identicon';
import { PageContainerFooter } from '../../components/ui/page-container';

import { EVENT } from '../../../shared/constants/metametrics';
import { Numeric } from '../../../shared/modules/Numeric';
import { EtherDenomination } from '../../../shared/constants/common';

export default class ConfirmPlumeSignature extends Component {
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
    cancelPlumeSignature: PropTypes.func.isRequired,
    plumeSignature: PropTypes.func.isRequired,
    conversionRate: PropTypes.number,
    history: PropTypes.object.isRequired,
    mostRecentOverviewPage: PropTypes.string.isRequired,
    requesterAddress: PropTypes.string,
    txData: PropTypes.object,
    subjectMetadata: PropTypes.object,
    nativeCurrency: PropTypes.string.isRequired,
  };

  state = {
    fromAccount: this.props.fromAccount,
  };

  renderHeader = () => {
    return (
      <div className="request-plume-signature__header">
        <div className="request-plume-signature__header-background" />

        <div className="request-plume-signature__header__text">
          {/* TODO: Translate into different languages and put under app/_locales */}
          Plume Signature
        </div>

        <div className="request-plume-signature__header__tip-container">
          <div className="request-plume-signature__header__tip" />
        </div>
      </div>
    );
  };

  renderAccount = () => {
    const { fromAccount } = this.state;
    const { t } = this.context;

    return (
      <div className="request-plume-signature__account">
        <div className="request-plume-signature__account-text">
          {`${t('account')}:`}
        </div>

        <div className="request-plume-signature__account-item">
          <AccountListItem account={fromAccount} />
        </div>
      </div>
    );
  };

  renderBalance = () => {
    const { conversionRate, nativeCurrency } = this.props;
    const {
      fromAccount: { balance },
    } = this.state;
    const { t } = this.context;

    const nativeCurrencyBalance = new Numeric(
      balance,
      16,
      EtherDenomination.WEI,
    )
      .applyConversionRate(conversionRate)
      .round(6)
      .toBase(10);

    return (
      <div className="request-plume-signature__balance">
        <div className="request-plume-signature__balance-text">
          {`${t('balance')}:`}
        </div>
        <div className="request-plume-signature__balance-value">
          {`${nativeCurrencyBalance} ${nativeCurrency}`}
        </div>
      </div>
    );
  };

  renderRequestIcon = () => {
    const { requesterAddress } = this.props;

    return (
      <div className="request-plume-signature__request-icon">
        <Identicon diameter={40} address={requesterAddress} />
      </div>
    );
  };

  renderAccountInfo = () => {
    return (
      <div className="request-plume-signature__account-info">
        {this.renderAccount()}
        {this.renderRequestIcon()}
        {this.renderBalance()}
      </div>
    );
  };

  renderBody = () => {
    const { subjectMetadata, txData } = this.props;
    const { t } = this.context;

    const targetSubjectMetadata = subjectMetadata[txData.msgParams.origin];
    const name = targetSubjectMetadata?.name || txData.msgParams.origin;
    // TODO: Translate into different languages and put under app/_locales
    const notice = `${txData.msgParams.origin} would like to generate a plume for the following message:`;

    return (
      <div className="request-plume-signature__body">
        {this.renderAccountInfo()}
        <div className="request-plume-signature__visual">
          <section>
            {targetSubjectMetadata?.iconUrl ? (
              <img
                className="request-plume-signature__visual-identicon"
                src={targetSubjectMetadata.iconUrl}
                alt=""
              />
            ) : (
              <i className="request-plume-signature__visual-identicon--default">
                {name.charAt(0).toUpperCase()}
              </i>
            )}
            <div className="request-plume-signature__notice">{notice}</div>
          </section>
        </div>
        <div className="request-plume-signature__message">
          <div className="request-plume-signature__message-text">
            {txData.msgParams.data}
          </div>
        </div>
      </div>
    );
  };

  renderFooter = () => {
    const {
      cancelPlumeSignature,
      clearConfirmTransaction,
      plumeSignature,
      history,
      mostRecentOverviewPage,
      txData,
    } = this.props;
    const { trackEvent, t } = this.context;

    return (
      <PageContainerFooter
        cancelText={t('cancel')}
        submitText={t('confirm')}
        onCancel={async (event) => {
          await cancelPlumeSignature(txData, event);
          trackEvent({
            category: EVENT.CATEGORIES.MESSAGES,
            event: 'Cancel',
            properties: {
              action: 'Plume Message Request',
              legacy_event: true,
            },
          });
          clearConfirmTransaction();
          history.push(mostRecentOverviewPage);
        }}
        onSubmit={async (event) => {
          await plumeSignature(txData, event);
          trackEvent({
            category: EVENT.CATEGORIES.MESSAGES,
            event: 'Confirm',
            properties: {
              action: 'Plume Message Request',
              legacy_event: true,
            },
          });
          clearConfirmTransaction();
          history.push(mostRecentOverviewPage);
        }}
      />
    );
  };

  render = () => {
    return (
      <div className="request-plume-signature__container">
        {this.renderHeader()}
        {this.renderBody()}
        {this.renderFooter()}
      </div>
    );
  };
}
