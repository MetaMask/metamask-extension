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
  getDomainResolutions,
  resetDomainResolution,
} from '../../../../ducks/domains';
import { getAddressBook, getInternalAccounts } from '../../../../selectors';
import AddContact from './add-contact.component';

const mapStateToProps = (state) => {
  return {
    addressBook: getAddressBook(state),
    internalAccounts: getInternalAccounts(state),
    qrCodeData: getQrCodeData(state),
    domainError: getDomainError(state),
    domainResolutions: getDomainResolutions(state),
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
