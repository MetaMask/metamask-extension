import { connect } from 'react-redux';
import { hideModal, qrCodeDetected } from '../../../../store/actions';
import QrScanner from './qr-scanner.component';

const mapDispatchToProps = (dispatch) => {
  return {
    hideModal: () => dispatch(hideModal()),
    qrCodeDetected: (data) => dispatch(qrCodeDetected(data)),
  };
};

export default connect(null, mapDispatchToProps)(QrScanner);
