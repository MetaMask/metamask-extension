import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../modal';

export default class InteractiveReplacementTokenModal extends PureComponent {
  static propTypes = {
    hideModal: PropTypes.func,
    custodian: PropTypes.object,
    url: PropTypes.string,
  };

  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  renderCustodyInfo(custodian) {
    let img;

    if (custodian.iconUrl) {
      img = (
        <div className="interactive-replacement-token-modal__img-container">
          <img
            className="interactive-replacement-token-modal__img"
            src={custodian.iconUrl}
            alt={custodian.displayName}
          />
        </div>
      );
    } else {
      img = (
        <div className="interactive-replacement-token-modal__img">
          <span>{custodian.displayName}</span>
        </div>
      );
    }

    return (
      <>
        {img}
        <p className="interactive-replacement-token-modal__title">
          {this.context.t('custodyRefreshTokenModalTitle')}
        </p>
        <p className="interactive-replacement-token-modal__description">
          {this.context.t('custodyRefreshTokenModalDescription', [
            custodian.displayName,
          ])}
        </p>
        <p className="interactive-replacement-token-modal__subtitle">
          {this.context.t('custodyRefreshTokenModalSubtitle')}
        </p>
        <p className="interactive-replacement-token-modal__description">
          {this.context.t('custodyRefreshTokenModalDescription1')}
          <br></br>
          <br></br>
          {this.context.t('custodyRefreshTokenModalDescription2')}
        </p>
      </>
    );
  }

  handleSubmit = () => {
    const { url } = this.props;
    global.platform.openTab({
      url,
    });

    this.context.trackEvent({
      category: 'MMI',
      event: 'User clicked refresh token link',
    });
  };

  handleClose = () => {
    this.props.hideModal();
  };

  render() {
    const { custodian } = this.props;

    return (
      <Modal
        onCancel={this.handleClose}
        onClose={this.handleClose}
        onSubmit={this.handleSubmit}
        submitText={custodian.displayName || 'Custodian'}
        cancelText={this.context.t('cancel')}
        containerClass="compliance-modal-container"
      >
        <div className="interactive-replacement-token-modal">
          {this.renderCustodyInfo(custodian)}
        </div>
      </Modal>
    );
  }
}
