import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../../shared/constants/app';
import { getEnvironmentType } from '../../../../../app/scripts/lib/util';

import { SNAPS_VIEW_ROUTE } from '../../../../helpers/constants/routes';
import { disableSnap, enableSnap } from '../../../../store/actions';
import SnapListTab from './snap-list-tab.component';

const mapStateToProps = (state, ownProps) => {
  const { history } = ownProps;
  const envIsPopup = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;
  const onClick = (snap) => {
    const route = `${SNAPS_VIEW_ROUTE}/${window.btoa(
      unescape(encodeURIComponent(snap.id)),
    )}`;
    history.push(route);
  };
  return {
    snaps: state.metamask.snaps,
    envIsPopup,
    onClick,
  };
};
const mapDispatchToProps = (dispatch) => ({
  onToggle: (snap) => {
    if (snap.enabled) {
      dispatch(disableSnap(snap.id));
    } else {
      dispatch(enableSnap(snap.id));
    }
  },
});

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(SnapListTab);
