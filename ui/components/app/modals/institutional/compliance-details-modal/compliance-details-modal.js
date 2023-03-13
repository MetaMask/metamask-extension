import PropTypes from 'prop-types';
import React from 'react';
import { useDispatch } from 'react-redux';
import Modal from '../../../modal';
import { hideModal } from '../../../../../store/actions';
import ComplianceDetails from '../../../../institutional/compliance-details';

export default function ComplianceDetailsModal({
  onGenerateComplianceReport,
  reportAddress,
}) {
  const dispatch = useDispatch();
  const handleClose = () => dispatch(hideModal);

  return (
    <Modal
      headerText="AML/CFT Compliance"
      hideFooter="true"
      onClose={handleClose}
      contentClass="compliance-details-modal-content"
    >
      <ComplianceDetails
        address={reportAddress}
        onClose={handleClose}
        onGenerate={onGenerateComplianceReport}
      />
    </Modal>
  );
}

ComplianceDetailsModal.propTypes = {
  reportAddress: PropTypes.func.isRequired,
  onGenerateComplianceReport: PropTypes.func.isRequired,
};
