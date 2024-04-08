import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  setAddSnapAccountEnabled,
  ///: END:ONLY_INCLUDE_IF
  setUseRequestQueue,
  setPetnamesEnabled,
  setFeatureNotificationsEnabled,
} from '../../../store/actions';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  getIsAddSnapAccountEnabled,
  ///: END:ONLY_INCLUDE_IF
  getUseRequestQueue,
  getPetnamesEnabled,
  getFeatureNotificationsEnabled,
} from '../../../selectors';
import ExperimentalTab from './experimental-tab.component';

const mapStateToProps = (state) => {
  const petnamesEnabled = getPetnamesEnabled(state);
  const featureNotificationsEnabled = getFeatureNotificationsEnabled(state);
  return {
    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    addSnapAccountEnabled: getIsAddSnapAccountEnabled(state),
    ///: END:ONLY_INCLUDE_IF
    useRequestQueue: getUseRequestQueue(state),
    petnamesEnabled,
    featureNotificationsEnabled,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    setAddSnapAccountEnabled: (val) => setAddSnapAccountEnabled(val),
    ///: END:ONLY_INCLUDE_IF
    setUseRequestQueue: (val) => setUseRequestQueue(val),
    setPetnamesEnabled: (value) => {
      return dispatch(setPetnamesEnabled(value));
    },
    setFeatureNotificationsEnabled: (value) => {
      return dispatch(setFeatureNotificationsEnabled(value));
    },
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(ExperimentalTab);
