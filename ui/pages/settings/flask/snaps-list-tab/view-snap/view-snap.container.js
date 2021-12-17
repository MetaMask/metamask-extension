import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { getSubjectMetadata } from '../../../../../selectors';
import { removePermittedAccount } from '../../../../../store/actions';
import ViewSnap from './view-snap.component';

const mapStateToProps = (state, ownProps) => {
  const { snap } = ownProps;
  const subjectMetadata = getSubjectMetadata(state);
  const connectedSubjects = [];
  Object.entries(subjectMetadata).forEach(([_, entry]) => {
    if (entry.subjectType === 'snap') {
      const { iconUrl, name, origin } = entry;
      connectedSubjects.push({ iconUrl, name, origin });
    }
  });
  return {
    snap,
    connectedSubjects,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onDisconnect: (origin, address) => {
      dispatch(removePermittedAccount(origin, address));
    },
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(ViewSnap);
