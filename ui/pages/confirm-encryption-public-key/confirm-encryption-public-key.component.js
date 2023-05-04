import React, { Component } from 'react';
import PropTypes from 'prop-types';
import log from 'loglevel';

import AccountListItem from '../../components/app/account-list-item';
import Identicon from '../../components/ui/identicon';
import { PageContainerFooter } from '../../components/ui/page-container';

import { MetaMetricsEventCategory } from '../../../shared/constants/metametrics';
import SiteOrigin from '../../components/ui/site-origin';
import { Numeric } from '../../../shared/modules/Numeric';
import { EtherDenomination } from '../../../shared/constants/common';
import { formatCurrency } from '../../helpers/utils/confirm-tx.util';
import { getValueFromWeiHex } from '../../../shared/modules/conversion.utils';

export default class ConfirmEncryptionPublicKey extends Component {
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
    cancelEncryptionPublicKey: PropTypes.func.isRequired,
    encryptionPublicKey: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
    requesterAddress: PropTypes.string,
    txData: PropTypes.object,
    subjectMetadata: PropTypes.object,
    mostRecentOverviewPage: PropTypes.string.isRequired,
    nativeCurrency: PropTypes.string.isRequired,
    currentCurrency: PropTypes.string.isRequired,
    conversionRate: PropTypes.number,
  };

  renderHeader = () => {
    return (
      <div className="request-encryption-public-key__header">
        <div className="request-encryption-public-key__header-background" />

        <div className="request-encryption-public-key__header__text">
          {this.context.t('encryptionPublicKeyRequest')}
        </div>

        <div className="request-encryption-public-key__header__tip-container">
          <div className="request-encryption-public-key__header__tip" />
        </div>
      </div>
    );
  };

  renderAccount = () => {
    const { fromAccount } = this.props;
    const { t } = this.context;

    return (
      <div className="request-encryption-public-key__account">
        <div className="request-encryption-public-key__account-text">
          {`${t('account')}:`}
        </div>

        <div className="request-encryption-public-key__account-item">
          <AccountListItem account={fromAccount} />
        </div>
      </div>
    );
  };

  renderBalance = () => {
    const {
      conversionRate,
      nativeCurrency,
      currentCurrency,
      fromAccount: { balance },
    } = this.props;
    const { t } = this.context;

    const nativeCurrencyBalance = conversionRate
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
      <div className="request-encryption-public-key__balance">
        <div className="request-encryption-public-key__balance-text">
          {`${t('balance')}:`}
        </div>
        <div className="request-encryption-public-key__balance-value">
          {`${nativeCurrencyBalance} ${
            conversionRate ? currentCurrency?.toUpperCase() : nativeCurrency
          }`}
        </div>
      </div>
    );
  };

  renderRequestIcon = () => {
    const { requesterAddress } = this.props;

    return (
      <div className="request-encryption-public-key__request-icon">
        <Identicon diameter={40} address={requesterAddress} />
      </div>
    );
  };

  renderAccountInfo = () => {
    return (
      <div className="request-encryption-public-key__account-info">
        {this.renderAccount()}
        {this.renderRequestIcon()}
        {this.renderBalance()}
      </div>
    );
  };

  renderBody = () => {
    const { subjectMetadata, txData } = this.props;
    const { t } = this.context;

    const targetSubjectMetadata = subjectMetadata[txData.origin];
    const notice = t('encryptionPublicKeyNotice', [
      <SiteOrigin siteOrigin={txData.origin} key={txData.origin} />,
    ]);
    const name = targetSubjectMetadata?.hostname || txData.origin;

    return (
      <div className="request-encryption-public-key__body">
        {this.renderAccountInfo()}
        <div className="request-encryption-public-key__visual">
          <section>
            {targetSubjectMetadata?.iconUrl ? (
              <img
                className="request-encryption-public-key__visual-identicon"
                src={targetSubjectMetadata.iconUrl}
                alt=""
              />
            ) : (
              <i className="request-encryption-public-key__visual-identicon--default">
                {name.charAt(0).toUpperCase()}
              </i>
            )}
            <div className="request-encryption-public-key__notice">
              {notice}
            </div>
          </section>
        </div>
      </div>
    );
  };

  renderFooter = () => {
    const {
      cancelEncryptionPublicKey,
      clearConfirmTransaction,
      encryptionPublicKey,
      history,
      mostRecentOverviewPage,
      txData,
    } = this.props;
    const { t, trackEvent } = this.context;

    return (
      <PageContainerFooter
        cancelText={t('cancel')}
        submitText={t('provide')}
        onCancel={async (event) => {
          await cancelEncryptionPublicKey(txData, event);
          trackEvent({
            category: MetaMetricsEventCategory.Messages,
            event: 'Cancel',
            properties: {
              action: 'Encryption public key Request',
              legacy_event: true,
            },
          });
          clearConfirmTransaction();
          history.push(mostRecentOverviewPage);
        }}
        onSubmit={async (event) => {
          await encryptionPublicKey(txData, event);
          this.context.trackEvent({
            category: MetaMetricsEventCategory.Messages,
            event: 'Confirm',
            properties: {
              action: 'Encryption public key Request',
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
    if (!this.props.txData) {
      log.warn('ConfirmEncryptionPublicKey Page: Missing txData prop.');
      return null;
    }

    return (
      <div className="request-encryption-public-key__container">
        {this.renderHeader()}
        {this.renderBody()}
        {this.renderFooter()}
      </div>
    );
  };
}
