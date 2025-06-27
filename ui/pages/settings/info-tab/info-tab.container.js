import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { setShowSupportDataConsentModal } from '../../../store/actions';
import InfoTab from './info-tab.component';

const mapStateToProps = (state) => {
  const {
    appState: { showSupportDataConsentModal },
  } = state;

  return {
    showSupportDataConsentModal,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setShowSupportDataConsentModal: (show) =>
      dispatch(setShowSupportDataConsentModal(show)),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(InfoTab);
