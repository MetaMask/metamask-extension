import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { getSubjectsWithPermission } from '../../../../../selectors';
import {
  disableSnap,
  enableSnap,
  removePermissionsFor,
} from '../../../../../store/actions';
import ViewSnap from './view-snap.component';

const mapStateToProps = (state, ownProps) => {
  const { location, history } = ownProps;
  const { pathname } = location;
  const pathNameTail = pathname.match(/[^/]+$/u)[0];
  const snap = state.metamask.snaps
    ? Object.entries(state.metamask.snaps)
        .map(([_, snapState]) => snapState)
        .find((snapState) => {
          const decoded = decodeURIComponent(escape(window.atob(pathNameTail)));
          return snapState.id === decoded;
        })
    : undefined;
  const connectedSubjects = getSubjectsWithPermission(
    state,
    snap.permissionName,
  );
  return {
    snap,
    history,
    connectedSubjects,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onDisconnect: (connectedOrigin, snapPermissionName) => {
      dispatch(
        removePermissionsFor({
          [connectedOrigin]: [snapPermissionName],
        }),
      );
    },
    onToggle: (snap) => {
      if (snap.enabled) {
        dispatch(disableSnap(snap.id));
      } else {
        dispatch(enableSnap(snap.id));
      }
    },
    dispatch,
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(ViewSnap);
