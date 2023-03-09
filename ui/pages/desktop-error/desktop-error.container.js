import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import { FORCE_DISABLE_DESKTOP } from '../../store/actionConstants';
import DesktopError from './desktop-error.component';

const mapStateToProps = () => ({});

const mapDispatchToProps = (dispatch) => ({
  forceDisableDesktop: async () => {
    dispatch({
      type: FORCE_DISABLE_DESKTOP,
    });
  },
});

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(DesktopError);
