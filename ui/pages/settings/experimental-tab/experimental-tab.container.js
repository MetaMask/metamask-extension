import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {
  setUseTokenDetection,
  setUseCollectibleDetection,
  setOpenSeaEnabled,
  setEIP1559V2Enabled,
  setTheme,
  setCustomNetworkListEnabled,
} from '../../../store/actions';
import {
  getUseTokenDetection,
  getUseCollectibleDetection,
  getOpenSeaEnabled,
  getEIP1559V2Enabled,
  getTheme,
  getIsCustomNetworkListEnabled,
} from '../../../selectors';
import ExperimentalTab from './experimental-tab.component';

const mapStateToProps = (state) => {
  return {
    useTokenDetection: getUseTokenDetection(
      state,
    ) /** TODO: Remove during TOKEN_DETECTION_V2 feature flag clean up */,
    useCollectibleDetection: getUseCollectibleDetection(state),
    openSeaEnabled: getOpenSeaEnabled(state),
    eip1559V2Enabled: getEIP1559V2Enabled(state),
    theme: getTheme(state),
    customNetworkListEnabled: getIsCustomNetworkListEnabled(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setUseTokenDetection: (val) =>
      dispatch(
        setUseTokenDetection(val),
      ) /** TODO: Remove during TOKEN_DETECTION_V2 feature flag clean up */,
    setUseCollectibleDetection: (val) =>
      dispatch(setUseCollectibleDetection(val)),
    setOpenSeaEnabled: (val) => dispatch(setOpenSeaEnabled(val)),
    setEIP1559V2Enabled: (val) => dispatch(setEIP1559V2Enabled(val)),
    setTheme: (val) => dispatch(setTheme(val)),
    setCustomNetworkListEnabled: (val) =>
      dispatch(setCustomNetworkListEnabled(val)),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(ExperimentalTab);
