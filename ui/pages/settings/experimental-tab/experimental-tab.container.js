import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {
  setUseTokenDetection,
  setUseCollectibleDetection,
  setOpenSeaEnabled,
} from '../../../store/actions';
import {
  getUseTokenDetection,
  getUseCollectibleDetection,
  getOpenSeaEnabled,
} from '../../../selectors';
import ExperimentalTab from './experimental-tab.component';

const mapStateToProps = (state) => {
  return {
    useTokenDetection: getUseTokenDetection(state),
    useCollectibleDetection: getUseCollectibleDetection(state),
    openSeaEnabled: getOpenSeaEnabled(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setUseTokenDetection: (val) => dispatch(setUseTokenDetection(val)),
    setUseCollectibleDetection: (val) =>
      dispatch(setUseCollectibleDetection(val)),
    setOpenSeaEnabled: (val) => dispatch(setOpenSeaEnabled(val)),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(ExperimentalTab);
