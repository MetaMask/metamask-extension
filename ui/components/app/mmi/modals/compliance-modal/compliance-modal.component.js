import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Modal from '../../../modal';

export default class ComplianceModal extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    hideModal: PropTypes.func,
  };

  handleSubmit = () => {
    global.platform.openTab({
      url: 'https://start.compliance.codefi.network/',
    });
  };

  handleClose = () => {
    this.props.hideModal();
  };

  render() {
    const { t } = this.context;

    return (
      <Modal
        onClose={this.handleClose}
        onSubmit={this.handleSubmit}
        submitText={t('openCodefiCompliance')}
        submitType="primary"
        containerClass="compliance-modal-container"
      >
        <div className="compliance-modal">
          <div className="compliance-modal__header">
            <div className="compliance-modal__header-logo">
              <img
                className="compliance-modal__header-logo__img"
                src="images/compliance-logo-small.svg"
                alt="Codefi Compliance"
              />
              {t('codefiCompliance')}
            </div>
            <div
              className="compliance-modal__header-close"
              onClick={this.handleClose}
              data-testid="compliance-modal-close"
            />
          </div>

          <br />
          <p>{t('complianceBlurb0')}</p>
          <br />
          <p>{t('complianceBlurb1')}</p>
          <br />
          <p>{t('complianceBlurpStep0')}</p>
          <br />
          <ol>
            <li>{t('complianceBlurbStep1')}</li>
            <li>{t('complianceBlurbStep2')}</li>
            <li>{t('complianceBlurbStep3')}</li>
            <li>{t('complianceBlurbStep4')}</li>
            <li>{t('complianceBlurbStep5')}</li>
          </ol>
        </div>
      </Modal>
    );
  }
}
