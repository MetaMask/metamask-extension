import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { setShowSupportDataConsentModal } from '../../../store/actions';
import type { MetaMaskReduxDispatch } from '../../../store/store';
import type { AppSliceState } from '../../../ducks/app/app';
import InfoTab from './info-tab.component';

const mapStateToProps = (state: AppSliceState) => {
  const {
    appState: { showSupportDataConsentModal },
  } = state;

  return {
    showSupportDataConsentModal,
  };
};

const mapDispatchToProps = (dispatch: MetaMaskReduxDispatch) => {
  return {
    setShowSupportDataConsentModal: (show: boolean) =>
      dispatch(setShowSupportDataConsentModal(show)),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(InfoTab);
