import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { getSubjectMetadata } from '../../../../../selectors';
import { removePermissionsFor } from '../../../../../store/actions';
import ViewSnap from './view-snap.component';

const mapStateToProps = (state, ownProps) => {
  const { snap, onRemove, onToggle } = ownProps;
  const subjectMetadata = getSubjectMetadata(state);
  const connectedSubjects = Object.entries(subjectMetadata).reduce(
    (val, [_, currSnap]) => {
      if (currSnap.subjectType === 'snap') {
        const { iconUrl, name, origin } = currSnap;
        return [...val, { iconUrl, name, origin }];
      }
      return val;
    },
    [],
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
