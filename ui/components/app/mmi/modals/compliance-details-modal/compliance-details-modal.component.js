import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Modal from '../../modal';
import ComplianceDetails from '../../compliance-details';

export default class ComplianceDetailsModal extends Component {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func.isRequired,
  };

  static propTypes = {
    hideModal: PropTypes.func,
    reportAddress: PropTypes.func.isRequired,
    onGenerateComplianceReport: PropTypes.func.isRequired,
  };

  handleClose = () => {
    this.props.hideModal();
  };

  render() {
    const { reportAddress, onGenerateComplianceReport } = this.props;
    return (
      <Modal
        headerText="AML/CFT Compliance"
        hideFooter="true"
        onClose={this.handleClose}
        contentClass="compliance-details-modal-content"
      >
        <ComplianceDetails
          address={reportAddress}
          onClose={this.handleClose}
          onGenerate={onGenerateComplianceReport}
        />
      </Modal>
    );
  }
}
