import { connect } from 'react-redux';
import {
  generateOtp,
  hideLoadingIndication,
  showLoadingIndication,
} from '../../store/actions';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import DesktopPairingPage from './desktop-pairing.component';

const mapDispatchToProps = (dispatch) => {
  return {
    generateOtp: () => generateOtp(),
    showLoadingIndication: () => dispatch(showLoadingIndication()),
    hideLoadingIndication: () => dispatch(hideLoadingIndication()),
  };
};

const mapStateToProps = (state) => {
  return {
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(DesktopPairingPage);
