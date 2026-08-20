import React, { Component, useContext } from 'react';
import PropTypes from 'prop-types';
import log from 'loglevel';
import { AvatarAccountSize } from '@metamask/design-system-react';
import AccountListItem from '../../components/app/account-list-item';
import { PreferredAvatar } from '../../components/app/preferred-avatar';
import { PageContainerFooter } from '../../components/ui/page-container';

import { MetaMetricsEventCategory } from '../../../shared/constants/metametrics';
import SiteOrigin from '../../components/ui/site-origin';
import { Numeric } from '../../../shared/lib/Numeric';
import { EtherDenomination } from '../../../shared/constants/common';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import { Nav } from '../confirmations/components/confirm/nav';
import { I18nContext } from '../../contexts/i18n';
import { useAnalytics } from '../../hooks/useAnalytics';

class ConfirmEncryptionPublicKeyBase extends Component {
  static propTypes = {
    t: PropTypes.func.isRequired,
    trackEvent: PropTypes.func.isRequired,
    createEventBuilder: PropTypes.func.isRequired,
    fromAccount: PropTypes.shape({
      address: PropTypes.string.isRequired,
      balance: PropTypes.string,
      name: PropTypes.string,
    }).isRequired,
    clearConfirmTransaction: PropTypes.func.isRequired,
    cancelEncryptionPublicKey: PropTypes.func.isRequired,
    encryptionPublicKey: PropTypes.func.isRequired,
    navigate: PropTypes.func.isRequired,
    requesterAddress: PropTypes.string,
    txData: PropTypes.object,
    subjectMetadata: PropTypes.object,
    mostRecentOverviewPage: PropTypes.string.isRequired,
    nativeCurrency: PropTypes.string.isRequired,
  };

  renderHeader = () => {
    const approvalId = this.props.txData?.id;

    return (
      <>
        <Nav confirmationId={approvalId} />
        <div className="request-encryption-public-key__header">
          <div className="request-encryption-public-key__header-background" />

          <div className="request-encryption-public-key__header__text">
            {this.props.t('encryptionPublicKeyRequest')}
          </div>

          <div className="request-encryption-public-key__header__tip-container">
            <div className="request-encryption-public-key__header__tip" />
          </div>
        </div>
      </>
    );
  };

  renderAccount = () => {
    const { fromAccount, t } = this.props;

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
      nativeCurrency,
      fromAccount: { balance },
      t,
    } = this.props;

    const nativeCurrencyBalance = new Numeric(
      balance,
      16,
      EtherDenomination.WEI,
    )
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
          {`${nativeCurrencyBalance} ${nativeCurrency}`}
        </div>
      </div>
    );
  };

  renderRequestIcon = () => {
    const { requesterAddress } = this.props;

    return (
      <div className="request-encryption-public-key__request-icon">
        <PreferredAvatar
          size={AvatarAccountSize.Lg}
          address={requesterAddress}
        />
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
    const { subjectMetadata, txData, t } = this.props;

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
      navigate,
      mostRecentOverviewPage,
      txData,
    } = this.props;
    const { t, trackEvent, createEventBuilder } = this.props;

    return (
      <PageContainerFooter
        cancelText={t('cancel')}
        submitText={t('provide')}
        onCancel={async (event) => {
          await cancelEncryptionPublicKey(txData, event);
          trackEvent(
            createEventBuilder('Cancel')
              .addCategory(MetaMetricsEventCategory.Messages)
              .addProperties({
                action: 'Encryption public key Request',
                legacy_event: true,
              })
              .build(),
          );
          clearConfirmTransaction();
          navigate(mostRecentOverviewPage);
        }}
        onSubmit={async (event) => {
          await encryptionPublicKey(txData, event);
          this.props.trackEvent(
            this.props
              .createEventBuilder('Confirm')
              .addCategory(MetaMetricsEventCategory.Messages)
              .addProperties({
                action: 'Encryption public key Request',
                legacy_event: true,
              })
              .build(),
          );
          clearConfirmTransaction();
          navigate(mostRecentOverviewPage);
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

function ConfirmEncryptionPublicKey(props) {
  const t = useContext(I18nContext);
  const { trackEvent, createEventBuilder } = useAnalytics();
  return (
    <ConfirmEncryptionPublicKeyBase
      {...props}
      t={t}
      trackEvent={trackEvent}
      createEventBuilder={createEventBuilder}
    />
  );
}

export default ConfirmEncryptionPublicKey;
