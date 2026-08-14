import { connect } from 'react-redux';
import { hideModal, qrCodeDetected } from '../../../../store/actions';
import QRCodeScannerComponent from './qr-scanner.component';

const mapDispatchToProps = (dispatch) => {
  return {
    hideModal: () => dispatch(hideModal()),
    qrCodeDetected: (data) => dispatch(qrCodeDetected(data)),
  };
};

const QRCodeScanner = connect(
  null,
  mapDispatchToProps,
)(QRCodeScannerComponent);

export default QRCodeScanner;
