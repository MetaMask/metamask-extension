import { connect } from 'react-redux';
import {
  getMetaMaskIdentities,
  ///: BEGIN:ONLY_INCLUDE_IF(snaps)
  getPermissions,
  ///: END:ONLY_INCLUDE_IF
} from '../../../selectors';
import PermissionPageContainer from './permission-page-container.component';

const mapStateToProps = (state, ownProps) => {
  const { selectedIdentities } = ownProps;
  ///: BEGIN:ONLY_INCLUDE_IF(snaps)
  const currentPermissions = getPermissions(
    state,
    ownProps.request.metadata?.origin,
  );
  ///: END:ONLY_INCLUDE_IF
  const allIdentities = getMetaMaskIdentities(state);
  const allIdentitiesSelected =
    Object.keys(selectedIdentities).length ===
      Object.keys(allIdentities).length && selectedIdentities.length > 1;

  return {
    allIdentitiesSelected,
    ///: BEGIN:ONLY_INCLUDE_IF(snaps)
    currentPermissions,
    ///: END:ONLY_INCLUDE_IF
  };
};

export default connect(mapStateToProps)(PermissionPageContainer);
