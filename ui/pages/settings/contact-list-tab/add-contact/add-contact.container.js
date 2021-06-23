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
  getEnsError,
  getEnsResolution,
  resetResolution,
} from '../../../../ducks/ens';
import AddContact from './add-contact.component';

const mapStateToProps = (state) => {
  return {
    qrCodeData: getQrCodeData(state),
    ensError: getEnsError(state),
    ensResolution: getEnsResolution(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    addToAddressBook: (recipient, nickname) =>
      dispatch(addToAddressBook(recipient, nickname)),
    scanQrCode: () => dispatch(showQrScanner()),
    qrCodeDetected: (data) => dispatch(qrCodeDetected(data)),
    resetResolution: () => dispatch(resetResolution()),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(AddContact);
