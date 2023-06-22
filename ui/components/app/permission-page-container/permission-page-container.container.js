import { connect } from 'react-redux';
import {
  getMetaMaskIdentities,
  ///: BEGIN:ONLY_INCLUDE_IN(snaps)
  getPermissions,
  ///: END:ONLY_INCLUDE_IN
} from '../../../selectors';
import PermissionPageContainer from './permission-page-container.component';

const mapStateToProps = (state, ownProps) => {
  const { selectedIdentities } = ownProps;
  ///: BEGIN:ONLY_INCLUDE_IN(snaps)
  const currentPermissions = getPermissions(
    state,
    ownProps.request.metadata?.origin,
  );
  ///: END:ONLY_INCLUDE_IN
  const allIdentities = getMetaMaskIdentities(state);
  const allIdentitiesSelected =
    Object.keys(selectedIdentities).length ===
      Object.keys(allIdentities).length && selectedIdentities.length > 1;

  return {
    allIdentitiesSelected,
    ///: BEGIN:ONLY_INCLUDE_IN(snaps)
    currentPermissions,
    ///: END:ONLY_INCLUDE_IN
  };
};

export default connect(mapStateToProps)(PermissionPageContainer);
