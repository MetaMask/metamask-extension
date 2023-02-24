import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../ui/button';

export default class CustodyConfirmLink extends Component {
  static propTypes = {
    link: PropTypes.object,
    custodianName: PropTypes.string,
    hideModal: PropTypes.func,
    custodians: PropTypes.array,
    setWaitForConfirmDeepLinkDialog: PropTypes.func,
    showAccountDetail: PropTypes.func,
    mmiAccounts: PropTypes.object,
  };

  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  renderCustodyInfo(custodian, deepLink) {
    let img;

    if (custodian.iconUrl) {
      img = (
        <div className="custody-confirm-link__img-container">
          <img
            className="custody-confirm-link__img"
            src="/images/logo/mmi-logo.svg"
            alt="MMI logo"
          />
          {'>'}
          <img
            className="custody-confirm-link__img"
            src={custodian.iconUrl}
            alt={custodian.displayName}
          />
        </div>
      );
    } else {
      img = (
        <div className="custody-confirm-link__img">
          <span>{custodian.displayName}</span>
        </div>
      );
    }

    return (
      <>
        {img}
        <p className="custody-confirm-link__title">
          {this.context.t('awaitingApproval')}
        </p>
        <p className="custody-confirm-link__description">
          {deepLink && deepLink.text
            ? deepLink.text
            : this.context.t('custodyDeeplinkDescription', [
                custodian.displayName,
              ])}
        </p>
      </>
    );
  }

  renderCustodyButton(custodian, deepLink) {
    if (!deepLink) {
      return this.context.t('close');
    }

    if (deepLink.action) {
      return deepLink.action;
    }

    return this.context.t('openCustodianApp', [custodian.displayName]);
  }

  render() {
    const {
      link,
      custodianName,
      hideModal,
      setWaitForConfirmDeepLinkDialog,
      showAccountDetail,
      mmiAccounts,
    } = this.props;

    const custodian = this.props.custodians.find(
      (item) => item.name === custodianName,
    );

    return (
      <div className="custody-confirm-link">
        {this.renderCustodyInfo(custodian, link)}
        <Button
          type="primary"
          className="custody-confirm-link__btn"
          onClick={() => {
            if (link && link.url) {
              global.platform.openTab({
                url: link.url,
              });
            }

            if (link && link.ethereum) {
              const mmiAccountsList = Object.keys(mmiAccounts);
              const ethAccounts = link.ethereum.accounts;

              const ethAccount = mmiAccountsList.find((account) => {
                return ethAccounts.find(
                  (value) => value.toLowerCase() === account.toLowerCase(),
                );
              });

              ethAccount && showAccountDetail(ethAccount.toLowerCase());
            }

            this.context.trackEvent({
              category: 'MMI',
              event: 'User clicked deeplink',
            });
            setWaitForConfirmDeepLinkDialog(false);
            hideModal();
          }}
        >
          {this.renderCustodyButton(custodian, link)}
        </Button>
      </div>
    );
  }
}
