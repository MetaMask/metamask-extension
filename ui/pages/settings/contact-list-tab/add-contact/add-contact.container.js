import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {
  addToAddressBook,
  showQrScanner,
  qrCodeDetected,
} from '../../../../store/actions';
import { getQrCodeData } from '../../../../ducks/app/app';
import {
  getDomainError,
  getDomainResolution,
  resetDomainResolution,
} from '../../../../ducks/domains';
import AddContact from './add-contact.component';

const mapStateToProps = (state) => {
  return {
    qrCodeData: getQrCodeData(state),
    domainError: getDomainError(state),
    domainResolution: getDomainResolution(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    addToAddressBook: (recipient, nickname) =>
      dispatch(addToAddressBook(recipient, nickname)),
    scanQrCode: () => dispatch(showQrScanner()),
    qrCodeDetected: (data) => dispatch(qrCodeDetected(data)),
    resetDomainResolution: () => dispatch(resetDomainResolution()),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(AddContact);
