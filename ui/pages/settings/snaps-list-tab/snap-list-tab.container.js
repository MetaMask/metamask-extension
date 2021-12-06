import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';

import {
  SNAPS_VIEW_ROUTE,
  SNAPS_LIST_ROUTE,
} from '../../../helpers/constants/routes';
import { disableSnap, enableSnap, removeSnap } from '../../../store/actions';
import SnapListTab from './snap-list-tab.component';

const mapStateToProps = (state, ownProps) => {
  const { location, history } = ownProps;
  const { pathname } = location;

  const viewingSnap = Boolean(pathname.match(SNAPS_VIEW_ROUTE));
  const pathNameTail = pathname.match(/[^/]+$/u)[0];
  const envIsPopup = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;
  const onClick = (_, snap) => {
    const route = `${SNAPS_VIEW_ROUTE}/${window.btoa(
      unescape(encodeURIComponent(snap.name)),
    )}`;
    history.push(route);
  };

  const onRemove = () => {
    history.push(SNAPS_LIST_ROUTE);
  };
  return {
    snaps: state.metamask.snaps,
    onRemove,
    currentSnap:
      state.metamask.snaps && viewingSnap
        ? Object.entries(state.metamask.snaps)
            .map(([_, value]) => value)
            .find((snap) => {
              const decoded = decodeURIComponent(
                escape(window.atob(pathNameTail)),
              );
              return snap.name === decoded;
            })
        : undefined,
    viewingSnap,
    envIsPopup,
    onClick,
  };
};
const mapDispatchToProps = (dispatch) => ({
  onToggle: (_, snap) => {
    if (snap.enabled) {
      dispatch(disableSnap(snap.name));
    } else {
      dispatch(enableSnap(snap.name));
    }
  },
});

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(SnapListTab);
