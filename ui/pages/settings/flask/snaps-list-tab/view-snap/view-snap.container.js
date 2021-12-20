import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { getSubjectsWithPermission } from '../../../../../selectors';
import { removePermissionsFor } from '../../../../../store/actions';
import ViewSnap from './view-snap.component';

const mapStateToProps = (state, ownProps) => {
  const { snap, onRemove, onToggle } = ownProps;
  const connectedSubjects = getSubjectsWithPermission(
    state,
    snap.permissionName,
  );
  return {
    snap,
    onRemove,
    onToggle,
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
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(ViewSnap);
