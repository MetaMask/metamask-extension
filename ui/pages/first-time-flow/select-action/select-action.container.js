import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import { setFirstTimeFlowType } from '../../../store/actions';
import { getFirstTimeFlowTypeRoute } from '../../../selectors';
import Welcome from './select-action.component';

const mapStateToProps = (state) => ({
  nextRoute: getFirstTimeFlowTypeRoute(state),
});

const mapDispatchToProps = (dispatch) => ({
  setFirstTimeFlowType: (type) => dispatch(setFirstTimeFlowType(type)),
});

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(Welcome);
